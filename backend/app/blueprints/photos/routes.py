"""Photo upload / list / fetch endpoints for ticket photos.

Auth model:
    Only the contractor currently assigned to a ticket can upload, list, or
    fetch its photos. Vendor / operator read access lives in a separate
    surface and isn't wired here yet.

Storage:
    Bytes live in TicketPhoto.photo_content (Postgres bytea) per the team
    decision. No separate storage backend, no orphan files to clean up.

Threat-model coverage:
    - IDOR: every read joins through Ticket.assigned_contractor and matches
      the caller's contractor row; misses return 404 (no existence leak).
    - Polyglots: Pillow strict-parse rejects non-images.
    - Decompression bombs: Image.MAX_IMAGE_PIXELS in photo_validation.
    - DoS: MAX_CONTENT_LENGTH (Flask) + MAX_PHOTO_BYTES (route) +
      MAX_PHOTOS_PER_TICKET cap.
    - EXIF leak: stripped on re-encode before storage; lat/lng captured
      separately for anomaly scoring.

Idempotency / offline retry:
    Mobile app generates a submission_uuid at capture time. We upsert keyed
    on that UUID so retries from a flaky network collapse onto the same row
    instead of inserting a duplicate. content_hash (sha256 of the sanitised
    bytes) is stored for app-level dedup and audit.
"""
import hashlib
import io
import logging
import uuid as uuid_mod

from flask import current_app, jsonify, request, send_file, url_for
from sqlalchemy.exc import IntegrityError

from app.models import Contractor, Ticket, TicketPhoto, db
from app.util.auth import token_required
from app.util.photo_validation import (
    PhotoValidationError,
    extract_gps,
    strip_exif_and_reencode,
    validate_image,
)

from . import photos_bp
from .schemas import photo_schema

log = logging.getLogger(__name__)


# ── Auth scoping helpers ────────────────────────────────────────────────────
def _get_contractor_for_request_user():
    """Resolve the Contractor row for the caller, or None if they aren't one."""
    return (
        db.session.query(Contractor)
        .filter(Contractor.user_id == request.user_id)
        .first()
    )


def _get_ticket_for_assigned_contractor(ticket_id, contractor):
    """Return the Ticket if the caller is its assigned contractor; else None.

    Returning None on miss OR auth failure (rather than a 403) means we don't
    leak whether a ticket id exists.
    """
    return (
        db.session.query(Ticket)
        .filter(
            Ticket.id == ticket_id,
            Ticket.assigned_contractor == contractor.id,
        )
        .first()
    )


def _get_photo_for_assigned_contractor(photo_id, contractor):
    """Photo is accessible iff the caller is the assigned contractor of its
    parent ticket. Joining through Ticket means a contractor who's been
    UN-assigned can no longer pull old photos."""
    return (
        db.session.query(TicketPhoto)
        .join(Ticket, TicketPhoto.ticket_id == Ticket.id)
        .filter(
            TicketPhoto.id == photo_id,
            Ticket.assigned_contractor == contractor.id,
        )
        .first()
    )


def _serialise(photo):
    out = photo_schema.dump(photo)
    out['url'] = url_for('photos_bp.get_photo', photo_id=photo.id, _external=False)
    return out


# ── POST /api/photos — upload ───────────────────────────────────────────────
@photos_bp.route('', methods=['POST'])
@token_required
def upload_photo():
    """Upload one image tied to a ticket the caller is assigned to.

    Multipart fields:
        ticket_id        (str, required)  UUID of the parent ticket
        photo            (file, required) the image
        submission_uuid  (str, optional)  client UUID for offline retry safety
        latitude         (float, optional) capture-time GPS, falls back to EXIF
        longitude        (float, optional) capture-time GPS, falls back to EXIF

    The submission_uuid is what makes the mobile offline queue safe: when
    connectivity flickers and the same upload is retried, we de-dup on this
    UUID instead of creating a second copy.
    """
    contractor = _get_contractor_for_request_user()
    if not contractor:
        # Authenticated but not a contractor (vendor / client / etc.).
        return jsonify({'error': 'forbidden'}), 403

    # ── Field parsing ─────────────────────────────────────────────────────
    ticket_id = (request.form.get('ticket_id') or '').strip()
    if not ticket_id:
        return jsonify({'error': 'ticket_id is required'}), 400

    upload = request.files.get('photo')
    if upload is None or not upload.filename:
        return jsonify({'error': 'photo file is required'}), 400

    submission_uuid = (
        request.form.get('submission_uuid')
        or request.headers.get('X-Submission-UUID')
    )
    if submission_uuid:
        try:
            uuid_mod.UUID(submission_uuid)
        except (TypeError, ValueError):
            return jsonify({'error': 'submission_uuid must be a valid UUID'}), 400
    else:
        # Server-generated fallback so callers without the header still get
        # an idempotent row. The client just won't be able to retry without
        # producing a different UUID. Fine for the basic case.
        submission_uuid = str(uuid_mod.uuid4())

    # Optional client-supplied GPS overrides the EXIF lat/lng if present.
    def _parse_optional_float(name):
        raw = request.form.get(name)
        if raw is None or raw == '':
            return None, None
        try:
            return float(raw), None
        except ValueError:
            return None, (jsonify({'error': f'{name} must be a number'}), 400)

    client_lat, err = _parse_optional_float('latitude')
    if err:
        return err
    client_lng, err = _parse_optional_float('longitude')
    if err:
        return err

    # ── Idempotency: existing row for this submission_uuid? ───────────────
    existing = (
        db.session.query(TicketPhoto)
        .filter(TicketPhoto.submission_uuid == submission_uuid)
        .first()
    )
    if existing:
        # Re-validate ownership before serving — otherwise an attacker who
        # knew/guessed someone else's submission_uuid could fish for photos.
        if existing.uploaded_by != contractor.id:
            return jsonify({'error': 'forbidden'}), 403
        return jsonify(_serialise(existing)), 200

    # ── Authorisation: caller must be the assigned contractor ─────────────
    ticket = _get_ticket_for_assigned_contractor(ticket_id, contractor)
    if not ticket:
        # 404 not 403 — don't leak whether the ticket exists.
        return jsonify({'error': 'ticket not found'}), 404

    # ── Per-ticket cap (DoS guard) ────────────────────────────────────────
    max_per_ticket = current_app.config.get('MAX_PHOTOS_PER_TICKET', 20)
    current_count = (
        db.session.query(TicketPhoto)
        .filter(TicketPhoto.ticket_id == ticket_id)
        .count()
    )
    if current_count >= max_per_ticket:
        return jsonify({
            'error': f'photo limit ({max_per_ticket}) reached for this ticket'
        }), 400

    # ── Read body (Flask's MAX_CONTENT_LENGTH already 413'd anything huge) ─
    try:
        raw_bytes = upload.read()
    except Exception:
        log.exception('failed to read uploaded file for ticket %s', ticket_id)
        return jsonify({'error': 'could not read uploaded file'}), 400

    inner_max = current_app.config.get('MAX_PHOTO_BYTES', 10 * 1024 * 1024)
    if len(raw_bytes) > inner_max:
        return jsonify({'error': f'file exceeds {inner_max} bytes'}), 413

    # ── Validate as image (Pillow + bomb cap) ─────────────────────────────
    try:
        img, fmt, _mime_type = validate_image(raw_bytes)
    except PhotoValidationError as e:
        return jsonify({'error': str(e)}), 400

    # GPS BEFORE strip — keep it as a signal even though we drop EXIF.
    exif_lat, exif_lng = extract_gps(img)
    final_lat = client_lat if client_lat is not None else exif_lat
    final_lng = client_lng if client_lng is not None else exif_lng

    # Re-encode without metadata. Bytes are now safe to store in the DB.
    sanitised_bytes = strip_exif_and_reencode(img, fmt)
    content_hash = hashlib.sha256(sanitised_bytes).hexdigest()

    # ── Persist row ───────────────────────────────────────────────────────
    photo = TicketPhoto(
        id=str(uuid_mod.uuid4()),
        ticket_id=ticket_id,
        photo_content=sanitised_bytes,
        latitude=final_lat,
        longitude=final_lng,
        uploaded_by=contractor.id,
        submission_uuid=submission_uuid,
        content_hash=content_hash,
        created_by=request.user_id,
        updated_by=request.user_id,
    )
    db.session.add(photo)
    try:
        db.session.commit()
    except IntegrityError:
        # Race: a concurrent upload won with the same submission_uuid.
        # Roll back and serve the canonical row.
        db.session.rollback()
        winner = (
            db.session.query(TicketPhoto)
            .filter(TicketPhoto.submission_uuid == submission_uuid)
            .first()
        )
        if winner and winner.uploaded_by == contractor.id:
            return jsonify(_serialise(winner)), 200
        return jsonify({'error': 'submission conflict'}), 409

    return jsonify(_serialise(photo)), 201


# ── GET /api/photos?ticket_id=X — list ──────────────────────────────────────
@photos_bp.route('', methods=['GET'])
@token_required
def list_photos():
    """List photos for a ticket the caller is assigned to.

    Returns metadata only. Bytes are fetched per-photo via GET /api/photos/<id>
    so the list response stays small.
    """
    ticket_id = (request.args.get('ticket_id') or '').strip()
    if not ticket_id:
        return jsonify({'error': 'ticket_id query param is required'}), 400

    contractor = _get_contractor_for_request_user()
    if not contractor:
        return jsonify({'error': 'forbidden'}), 403

    ticket = _get_ticket_for_assigned_contractor(ticket_id, contractor)
    if not ticket:
        return jsonify({'error': 'ticket not found'}), 404

    photos = (
        db.session.query(TicketPhoto)
        .filter(TicketPhoto.ticket_id == ticket_id)
        .order_by(TicketPhoto.created_at.desc())
        .all()
    )
    return jsonify([_serialise(p) for p in photos]), 200


# ── GET /api/photos/<id> — fetch bytes ──────────────────────────────────────
@photos_bp.route('/<photo_id>', methods=['GET'])
@token_required
def get_photo(photo_id):
    """Stream the photo bytes if the caller is the assigned contractor."""
    contractor = _get_contractor_for_request_user()
    if not contractor:
        return jsonify({'error': 'forbidden'}), 403

    photo = _get_photo_for_assigned_contractor(photo_id, contractor)
    if not photo:
        return jsonify({'error': 'photo not found'}), 404

    response = send_file(
        io.BytesIO(photo.photo_content),
        mimetype='image/jpeg',
        as_attachment=False,
        conditional=False,
        max_age=0,
    )
    # Defense-in-depth response headers:
    #   nosniff:  prevent MIME-sniffing attacks (image served as HTML/JS).
    #   CSP:      block any embedded resources from loading if a polyglot
    #             ever gets through and the browser tries to render it.
    #   Cache:    private, no-store — these images contain operational PII.
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Content-Security-Policy'] = "default-src 'none'"
    response.headers['Cache-Control'] = 'private, no-store'
    return response

"""Photo upload / list / fetch endpoints for ticket photos.

Auth model:
    Only the contractor *currently assigned* to a ticket can upload, list, or
    fetch its photos. Vendor / operator read access lives in a separate
    surface and isn't wired here yet.

Threat-model coverage (see threat-model table in the PR description):
    - IDOR: every read joins through Ticket.assigned_contractor and matches
      the caller's auth user id; misses return 404 (no existence leak).
    - Polyglots: Pillow strict-parse + sanitised re-encode strips anything
      that isn't pixels.
    - Path traversal: storage keys are server-generated; FilesystemStorage
      rejects keys outside its root.
    - Decompression bombs: Image.MAX_IMAGE_PIXELS in photo_validation.
    - DoS: MAX_CONTENT_LENGTH (Flask) + MAX_PHOTO_BYTES (route) +
      MAX_PHOTOS_PER_TICKET cap.
    - Idempotency: client-supplied submission_uuid is unique-indexed; replays
      return the existing row.
    - EXIF leak: stripped before storage; lat/lng captured separately for
      anomaly scoring.
"""
import io
import logging
import uuid as uuid_mod

from flask import current_app, jsonify, request, send_file, url_for
from sqlalchemy.exc import IntegrityError

from app.models import Contractor, Ticket, TicketPhoto, db
from app.util.auth import token_required
from app.util.photo_validation import (
    FORMAT_TO_EXTENSION,
    PhotoValidationError,
    extract_gps,
    sha256_hex,
    strip_exif_and_reencode,
    validate_image,
)
from app.util.storage import StorageKeyError, make_photo_storage_key

from . import photos_bp
from .schemas import photo_schema

log = logging.getLogger(__name__)


# ── Auth scoping helpers ────────────────────────────────────────────────────
def _get_contractor_for_request_user():
    """Resolve the Contractor row for the caller, or None if they aren't one.

    The JWT carries the auth user id; Contractor.user_id is the FK back to
    that. Required because Ticket.assigned_contractor references contractor.id
    (the contractor's own primary key), not the auth user id.
    """
    return (
        db.session.query(Contractor)
        .filter(Contractor.user_id == request.user_id)
        .first()
    )


def _get_ticket_for_assigned_contractor(ticket_id, contractor):
    """Return the Ticket if the caller is its assigned contractor; else None.

    Returning None on miss OR auth failure (rather than a 403) means we don't
    leak whether a ticket id exists — same response either way.
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
        ticket_id        (int, required)
        photo            (file, required)
        submission_uuid  (str, optional but recommended for offline-sync)

    The submission_uuid is what makes the mobile offline queue safe: when
    connectivity flickers and the same upload is retried, we de-dup on this
    UUID instead of creating a second copy.
    """
    contractor = _get_contractor_for_request_user()
    if not contractor:
        # Authenticated but not a contractor (vendor / client / etc.).
        return jsonify({'error': 'forbidden'}), 403

    # ── Field parsing ─────────────────────────────────────────────────────
    ticket_id_raw = request.form.get('ticket_id', '')
    if not ticket_id_raw.isdigit():
        return jsonify({'error': 'ticket_id is required and must be an integer'}), 400
    ticket_id = int(ticket_id_raw)

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
        # idempotent storage rows. The client just won't be able to retry
        # without producing a different UUID — that's fine for the basic case.
        submission_uuid = str(uuid_mod.uuid4())

    # ── Idempotency: existing row? ────────────────────────────────────────
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
        img, fmt, mime_type = validate_image(raw_bytes)
    except PhotoValidationError as e:
        return jsonify({'error': str(e)}), 400

    # GPS BEFORE strip — we want this signal even though we drop EXIF.
    exif_lat, exif_lng = extract_gps(img)

    # Re-encode without metadata. Bytes are now safe to store.
    sanitised_bytes = strip_exif_and_reencode(img, fmt)
    content_hash = sha256_hex(sanitised_bytes)

    extension = FORMAT_TO_EXTENSION.get(fmt, fmt.lower())
    storage = current_app.config['PHOTO_STORAGE']

    try:
        storage_key = make_photo_storage_key(ticket_id, extension)
    except StorageKeyError as e:
        log.exception('storage key generation failed')
        return jsonify({'error': str(e)}), 500

    try:
        bytes_written = storage.save(storage_key, io.BytesIO(sanitised_bytes))
    except Exception:
        log.exception('storage save failed for ticket %s key %s', ticket_id, storage_key)
        return jsonify({'error': 'storage error'}), 500

    # ── Persist metadata row ──────────────────────────────────────────────
    photo = TicketPhoto(
        ticket_id=ticket_id,
        uploaded_by=contractor.id,
        submission_uuid=submission_uuid,
        storage_key=storage_key,
        content_hash=content_hash,
        mime_type=mime_type,
        byte_size=bytes_written,
        exif_lat=exif_lat,
        exif_lng=exif_lng,
    )
    db.session.add(photo)
    try:
        db.session.commit()
    except IntegrityError:
        # Race: a concurrent upload won with the same UUID. Roll back, clean
        # up the orphan file we just wrote, and serve the canonical row.
        db.session.rollback()
        try:
            storage.delete(storage_key)
        except Exception:
            log.exception('failed to clean up orphan storage key %s', storage_key)

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
    """List photos for a ticket the caller is assigned to."""
    ticket_id_raw = request.args.get('ticket_id', '')
    if not ticket_id_raw.isdigit():
        return jsonify({'error': 'ticket_id query param is required'}), 400
    ticket_id = int(ticket_id_raw)

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
@photos_bp.route('/<int:photo_id>', methods=['GET'])
@token_required
def get_photo(photo_id):
    """Stream the photo bytes if the caller is the assigned contractor."""
    contractor = _get_contractor_for_request_user()
    if not contractor:
        return jsonify({'error': 'forbidden'}), 403

    photo = _get_photo_for_assigned_contractor(photo_id, contractor)
    if not photo:
        return jsonify({'error': 'photo not found'}), 404

    storage = current_app.config['PHOTO_STORAGE']
    try:
        stream = storage.open(photo.storage_key)
    except StorageKeyError:
        # Storage row exists but file is missing — treat as 404 from caller's
        # perspective and log loudly so we notice corruption.
        log.error(
            'storage key missing for photo %s (ticket %s, key %s)',
            photo.id, photo.ticket_id, photo.storage_key,
        )
        return jsonify({'error': 'photo not found'}), 404
    except Exception:
        log.exception('storage open failed for photo %s', photo_id)
        return jsonify({'error': 'storage error'}), 500

    response = send_file(
        stream,
        mimetype=photo.mime_type,
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

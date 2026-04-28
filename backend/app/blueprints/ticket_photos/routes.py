import os
from datetime import datetime, timezone
from uuid import uuid4

from flask import current_app, jsonify, request, send_from_directory
from marshmallow import ValidationError
from werkzeug.utils import secure_filename

from app.models import Contractor, Ticket, TicketPhoto, Work_order, db
from app.util.auth import token_required

from . import ticket_photos_bp
from .schemas import ticket_photo_schema, ticket_photos_schema, ticket_photo_upload_schema


MIME_EXTENSION_MAP = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/heic': '.heic',
}


def _get_ticket(ticket_id):
    return db.session.get(Ticket, ticket_id)


def _get_current_contractor():
    return (
        db.session.query(Contractor)
        .filter(Contractor.user_id == request.user_id)
        .first()
    )


def _contractor_can_access_ticket(ticket, contractor):
    return contractor is not None and ticket.assigned_contractor == contractor.id


def _vendor_can_access_ticket(ticket, user_id):
    work_order = db.session.get(Work_order, ticket.work_order_id)
    return work_order is not None and work_order.assigned_vendor == user_id


def _authorize_ticket_access(ticket, require_contractor=False):
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404

    if request.user_role == 'contractor':
        contractor = _get_current_contractor()
        if _contractor_can_access_ticket(ticket, contractor):
            return None
    elif request.user_role == 'vendor' and not require_contractor:
        if _vendor_can_access_ticket(ticket, request.user_id):
            return None

    if require_contractor and request.user_role != 'contractor':
        return jsonify({'error': 'Contractor privileges required'}), 403

    return jsonify({'error': 'Not authorized to access this ticket'}), 403


def _build_file_url(storage_key):
    return f"/tickets/photos/files/{storage_key}"


def _save_photo_file(ticket_id, photo_file):
    allowed_mime_types = current_app.config.get('ALLOWED_FIELD_PHOTO_MIME_TYPES', set())
    upload_root = current_app.config['FIELD_PHOTO_UPLOAD_DIR']

    if not photo_file or not photo_file.filename:
        return None, None, (jsonify({'error': 'photo file is required'}), 400)

    mime_type = photo_file.mimetype
    if mime_type not in allowed_mime_types:
        return None, None, (jsonify({'error': 'unsupported file type'}), 415)

    original_filename = secure_filename(photo_file.filename)
    _, ext = os.path.splitext(original_filename)
    extension = ext.lower() or MIME_EXTENSION_MAP.get(mime_type, '')
    filename = f"{uuid4().hex}{extension}"

    ticket_dir = os.path.join(upload_root, str(ticket_id))
    os.makedirs(ticket_dir, exist_ok=True)

    absolute_path = os.path.join(ticket_dir, filename)
    photo_file.save(absolute_path)

    storage_key = f"{ticket_id}/{filename}"
    return storage_key, original_filename, None


@ticket_photos_bp.route('/<int:ticket_id>/photos', methods=['POST'])
@token_required
def upload_ticket_photo(ticket_id):
    ticket = _get_ticket(ticket_id)
    error_response = _authorize_ticket_access(ticket, require_contractor=True)
    if error_response:
        return error_response

    contractor = _get_current_contractor()
    if contractor is None:
        return jsonify({'error': 'Contractor not found'}), 404

    try:
        metadata = ticket_photo_upload_schema.load(request.form.to_dict())
    except ValidationError as e:
        return jsonify(e.messages), 400

    photo_file = request.files.get('photo')
    storage_key, original_filename, file_error = _save_photo_file(ticket_id, photo_file)
    if file_error:
        return file_error

    photo = TicketPhoto(
        ticket_id=ticket.id,
        contractor_id=contractor.id,
        file_url=_build_file_url(storage_key),
        storage_key=storage_key,
        original_filename=original_filename,
        mime_type=photo_file.mimetype,
        caption=metadata.get('caption'),
        photo_type=metadata.get('photo_type'),
        taken_at=metadata.get('taken_at'),
        uploaded_at=datetime.now(timezone.utc),
        gps_latitude=metadata.get('gps_latitude'),
        gps_longitude=metadata.get('gps_longitude'),
    )
    db.session.add(photo)
    db.session.commit()

    return ticket_photo_schema.jsonify(photo), 201


@ticket_photos_bp.route('/<int:ticket_id>/photos', methods=['GET'])
@token_required
def list_ticket_photos(ticket_id):
    ticket = _get_ticket(ticket_id)
    error_response = _authorize_ticket_access(ticket)
    if error_response:
        return error_response

    photos = (
        db.session.query(TicketPhoto)
        .filter(TicketPhoto.ticket_id == ticket_id)
        .order_by(TicketPhoto.uploaded_at.desc())
        .all()
    )

    return ticket_photos_schema.jsonify(photos), 200


@ticket_photos_bp.route('/photos/files/<path:storage_key>', methods=['GET'])
@token_required
def get_ticket_photo_file(storage_key):
    photo = (
        db.session.query(TicketPhoto)
        .filter(TicketPhoto.storage_key == storage_key)
        .first()
    )
    if not photo:
        return jsonify({'error': 'Photo not found'}), 404

    ticket = _get_ticket(photo.ticket_id)
    error_response = _authorize_ticket_access(ticket)
    if error_response:
        return error_response

    upload_root = current_app.config['FIELD_PHOTO_UPLOAD_DIR']
    directory, filename = os.path.split(os.path.join(upload_root, storage_key))
    return send_from_directory(directory, filename)

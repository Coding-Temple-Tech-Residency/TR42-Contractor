from flask import jsonify, request
from marshmallow import ValidationError

from app.models import Tickets, Work_orders, db
from app.util.auth import token_required

from . import work_orders_bp
from .schemas import work_order_schema, work_order_status_update_schema


def contractor_is_assigned(work_order_id, contractor_id):
    return (
        db.session.query(Tickets.id)
        .filter(
            Tickets.work_order_id == work_order_id,
            Tickets.assigned_contractor == contractor_id,
        )
        .first()
        is not None
    )


def get_work_order_for_request_user(work_order_id):
    work_order = db.session.get(Work_orders, work_order_id)
    if not work_order:
        return None, (jsonify({'error': 'Work order not found'}), 404)

    if request.user_role == 'contractor':
        if not contractor_is_assigned(work_order_id, request.user_id):
            return None, (jsonify({'error': 'Not authorized to access this work order'}), 403)
    elif request.user_role == 'vendor':
        if work_order.assigned_vendor != request.user_id:
            return None, (jsonify({'error': 'Not authorized to access this work order'}), 403)

    return work_order, None


@work_orders_bp.route('/<int:work_order_id>', methods=['GET'])
@token_required
def get_work_order(work_order_id):
    work_order, error_response = get_work_order_for_request_user(work_order_id)
    if error_response:
        return error_response

    return work_order_schema.jsonify(work_order), 200


@work_orders_bp.route('/<int:work_order_id>/status', methods=['PATCH'])
@token_required
def update_work_order_status(work_order_id):
    if request.user_role != 'contractor':
        return jsonify({'error': 'Contractor privileges required'}), 403

    try:
        data = work_order_status_update_schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify(e.messages), 400

    work_order, error_response = get_work_order_for_request_user(work_order_id)
    if error_response:
        return error_response

    work_order.current_status = data['status']
    db.session.commit()

    return work_order_schema.jsonify(work_order), 200

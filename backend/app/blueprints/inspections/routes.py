from flask import request, jsonify
from app.models import (
    InspectionTemplates, InspectionSections, InspectionItems,
    Inspections, InspectionResults, db,
)
from .schemas import (
    template_schema, templates_schema,
    inspection_schema, inspections_schema,
    submit_schema,
)
from marshmallow import ValidationError
from . import inspections_bp
from app.util.auth import token_required
from datetime import datetime, timezone


# ─────────────────────────────────────────────────────────────────────────────
# GET /inspections/checklist
# Returns the active inspection template with all sections and items.
# The frontend renders this dynamically — no hardcoded checklist.
# ─────────────────────────────────────────────────────────────────────────────
@inspections_bp.route('/checklist', methods=['GET'])
@token_required
def get_checklist():
    template = db.session.query(InspectionTemplates).filter_by(is_active=True).first()

    if not template:
        return jsonify({'error': 'No active inspection template found.'}), 404

    return template_schema.jsonify(template), 200


# ─────────────────────────────────────────────────────────────────────────────
# GET /inspections/templates
# Returns all templates (active and inactive) for admin management.
# ─────────────────────────────────────────────────────────────────────────────
@inspections_bp.route('/templates', methods=['GET'])
@token_required
def get_all_templates():
    templates = db.session.query(InspectionTemplates).all()
    return templates_schema.jsonify(templates), 200


# ─────────────────────────────────────────────────────────────────────────────
# POST /inspections/submit
# Contractor submits an inspection.
#
# If no_issues_found = true:
#   All items are auto-marked as passed. No individual results needed.
#
# If no_issues_found = false:
#   The "results" array must contain per-item pass/fail data.
# ─────────────────────────────────────────────────────────────────────────────
@inspections_bp.route('/submit', methods=['POST'])
@token_required
def submit_inspection():
    json_data = request.get_json()
    if not json_data:
        return jsonify({'error': 'No input data provided.'}), 400

    try:
        data = submit_schema.load(json_data)
    except ValidationError as e:
        return jsonify(e.messages), 400

    # Verify template exists
    template = db.session.get(InspectionTemplates, data['template_id'])
    if not template:
        return jsonify({'error': 'Inspection template not found.'}), 404

    # Determine overall status
    if data['skipped']:
        status = 'skipped'
    elif data['no_issues_found']:
        status = 'passed'
    else:
        # If any item failed, the inspection status is 'failed'
        has_failure = any(r.get('passed') is False for r in data.get('results', []))
        status = 'failed' if has_failure else 'passed'

    inspection = Inspections(
        template_id=data['template_id'],
        contractor_id=request.user_id,
        status=status,
        no_issues_found=data['no_issues_found'],
        skipped=data['skipped'],
        submitted_at=datetime.now(timezone.utc),
        notes=data.get('notes'),
    )
    db.session.add(inspection)
    db.session.flush()  # get the inspection.id before adding results

    if data['skipped']:
        # User tapped X to skip. Record the bypass but don't create item results.
        pass
    elif data['no_issues_found']:
        # Auto-create passed results for every item in the template
        all_items = (
            db.session.query(InspectionItems)
            .join(InspectionSections)
            .filter(InspectionSections.template_id == data['template_id'])
            .all()
        )
        for item in all_items:
            result = InspectionResults(
                inspection_id=inspection.id,
                item_id=item.id,
                passed=True,
            )
            db.session.add(result)
    else:
        # Save individual item results from the request
        for r in data.get('results', []):
            # Verify item belongs to this template
            item = db.session.get(InspectionItems, r['item_id'])
            if not item:
                db.session.rollback()
                return jsonify({'error': f'Item {r["item_id"]} not found.'}), 400

            result = InspectionResults(
                inspection_id=inspection.id,
                item_id=r['item_id'],
                passed=r['passed'],
                note=r.get('note'),
            )
            db.session.add(result)

    db.session.commit()

    return inspection_schema.jsonify(inspection), 201


# ─────────────────────────────────────────────────────────────────────────────
# GET /inspections/latest
# Returns the contractor's most recent inspection.
# Used by the app to decide if the contractor needs to inspect before shift.
# ─────────────────────────────────────────────────────────────────────────────
@inspections_bp.route('/latest', methods=['GET'])
@token_required
def get_latest_inspection():
    inspection = (
        db.session.query(Inspections)
        .filter_by(contractor_id=request.user_id)
        .order_by(Inspections.created_at.desc())
        .first()
    )

    if not inspection:
        return jsonify({'message': 'No inspections found.'}), 404

    return inspection_schema.jsonify(inspection), 200


# ─────────────────────────────────────────────────────────────────────────────
# GET /inspections/<id>
# Returns a specific inspection by ID.
# ─────────────────────────────────────────────────────────────────────────────
@inspections_bp.route('/<int:inspection_id>', methods=['GET'])
@token_required
def get_inspection(inspection_id):
    inspection = db.session.get(Inspections, inspection_id)

    if not inspection:
        return jsonify({'error': 'Inspection not found.'}), 404

    # Only allow the contractor who submitted it to view it
    if inspection.contractor_id != request.user_id:
        return jsonify({'error': 'Unauthorized.'}), 403

    return inspection_schema.jsonify(inspection), 200


# ─────────────────────────────────────────────────────────────────────────────
# GET /inspections/history
# Returns all inspections for the logged-in contractor.
# ─────────────────────────────────────────────────────────────────────────────
@inspections_bp.route('/history', methods=['GET'])
@token_required
def get_inspection_history():
    inspections = (
        db.session.query(Inspections)
        .filter_by(contractor_id=request.user_id)
        .order_by(Inspections.created_at.desc())
        .all()
    )

    return inspections_schema.jsonify(inspections), 200

from app.extensions import ma
from app.models import InspectionTemplates, InspectionSections, InspectionItems, Inspections, InspectionResults
from marshmallow import fields, Schema, validate


# ── Read schemas (for GET responses) ──────────────────────────────────────────

class InspectionItemSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = InspectionItems
        include_fk = True


class InspectionSectionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = InspectionSections
        include_fk = True

    items = fields.Nested(InspectionItemSchema, many=True)


class InspectionTemplateSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = InspectionTemplates
        include_fk = True

    sections = fields.Nested(InspectionSectionSchema, many=True)


class InspectionResultSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = InspectionResults
        include_fk = True


class InspectionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Inspections
        include_fk = True

    results = fields.Nested(InspectionResultSchema, many=True)


# ── Write schemas (for POST request validation) ──────────────────────────────

class ItemResultInputSchema(Schema):
    """One item result inside a submission."""
    item_id = fields.Int(required=True)
    passed = fields.Bool(required=True)
    note = fields.Str(required=False, load_default=None)


class InspectionSubmitSchema(Schema):
    """Payload for submitting an inspection.

    - no_issues_found=true  → all items auto-marked as passed.
    - skipped=true          → user tapped the X on the modal. No results created.
                              Status is recorded as 'skipped' so leadership can
                              still see who bypassed the inspection.
    - Otherwise             → per-item results[] must be provided.
    """
    template_id = fields.Int(required=True)
    no_issues_found = fields.Bool(required=False, load_default=False)
    skipped = fields.Bool(required=False, load_default=False)
    results = fields.List(fields.Nested(ItemResultInputSchema), required=False, load_default=[])
    notes = fields.Str(required=False, load_default=None)


# ── Instances ─────────────────────────────────────────────────────────────────

template_schema = InspectionTemplateSchema()
templates_schema = InspectionTemplateSchema(many=True)
inspection_schema = InspectionSchema()
inspections_schema = InspectionSchema(many=True)
submit_schema = InspectionSubmitSchema()

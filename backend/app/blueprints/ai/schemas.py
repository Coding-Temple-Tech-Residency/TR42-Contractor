from marshmallow import Schema, fields


class InspectionAssistSchema(Schema):
    notes = fields.Str(required=True)


class SaveReportSchema(Schema):
    """Payload the frontend sends when saving an AI-generated report."""
    title               = fields.Str(required=True)
    priority            = fields.Str(required=True, validate=lambda v: v in ('low', 'medium', 'high'))
    category            = fields.Str(required=True)
    description         = fields.Str(required=True)
    recommended_actions = fields.List(fields.Str(), required=True)
    raw_notes           = fields.Str(required=False, load_default=None)
    inspection_id       = fields.Int(required=False, load_default=None)  # optional link to Inspections row


class AiReportSchema(Schema):
    """Shape of a saved report returned to the client."""
    id                  = fields.Int()
    contractor_id       = fields.Int()
    inspection_id       = fields.Int(allow_none=True)
    title               = fields.Str()
    priority            = fields.Str()
    category            = fields.Str()
    description         = fields.Str()
    recommended_actions = fields.List(fields.Str())
    raw_notes           = fields.Str()
    created_at          = fields.DateTime()


inspection_assist_schema = InspectionAssistSchema()
save_report_schema       = SaveReportSchema()
ai_report_schema         = AiReportSchema()
ai_reports_schema        = AiReportSchema(many=True)

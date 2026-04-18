from marshmallow import Schema, fields

class InspectionAssistSchema(Schema):
    notes = fields.Str(required=True)

inspection_assist_schema = InspectionAssistSchema()

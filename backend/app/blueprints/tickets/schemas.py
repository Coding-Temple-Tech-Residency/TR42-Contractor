from marshmallow_sqlalchemy import auto_field

from app.extensions import ma
from app.models import Tickets
from marshmallow import fields, Schema, validate

class TicketSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Tickets
        include_fk = True
    id = auto_field(dump_only=True)

class TicketUpdateSchema(Schema):
    contractor_notes = fields.Str(required=False)
    status = fields.Str(required=False, validate=validate.OneOf(["to_do", "in_progress", "completed"]),)
    start_time = fields.AwareDateTime(required=False)
    end_time = fields.AwareDateTime(required=False)
    start_location = fields.Str(required=False)
    end_location = fields.Str(required=False)
    
ticket_schema = TicketSchema()
tickets_schema = TicketSchema(many=True)
ticket_update_schema = TicketUpdateSchema()
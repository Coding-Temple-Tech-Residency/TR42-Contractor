from marshmallow_sqlalchemy import auto_field

from app.extensions import ma
from app.models import Tickets
from marshmallow import fields, Schema

class TicketSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Tickets
        include_fk = True
    id = auto_field(dump_only=True)

class TicketUpdateSchema(Schema):
    contractor_notes = fields.Str(required=False)
    

tickets_schema = TicketSchema(many=True)
ticket_update_schema = TicketUpdateSchema()
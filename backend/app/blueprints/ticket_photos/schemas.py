from marshmallow import Schema, fields, validate

from app.extensions import ma
from app.models import TicketPhoto


PHOTO_TYPES = ["before", "during", "after", "issue", "completion"]


class TicketPhotoSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = TicketPhoto
        include_fk = True


class TicketPhotoUploadSchema(Schema):
    caption = fields.Str(required=False, allow_none=True)
    photo_type = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.OneOf(PHOTO_TYPES),
    )
    taken_at = fields.AwareDateTime(required=False, allow_none=True)
    gps_latitude = fields.Float(
        required=False,
        allow_none=True,
        validate=validate.Range(min=-90, max=90),
    )
    gps_longitude = fields.Float(
        required=False,
        allow_none=True,
        validate=validate.Range(min=-180, max=180),
    )


ticket_photo_schema = TicketPhotoSchema()
ticket_photos_schema = TicketPhotoSchema(many=True)
ticket_photo_upload_schema = TicketPhotoUploadSchema()

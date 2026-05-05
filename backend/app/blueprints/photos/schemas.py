from marshmallow import Schema, fields


class PhotoOutSchema(Schema):
    """Shape returned to the client for a single photo.

    `photo_content` (the bytes) is intentionally NOT exposed here. Clients
    address photos by `id` and fetch bytes via GET /api/photos/<id>.
    """
    id = fields.Str()
    ticket_id = fields.Str()
    uploaded_by = fields.Str()
    latitude = fields.Float(allow_none=True)
    longitude = fields.Float(allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime(allow_none=True)
    created_by = fields.Str()
    updated_by = fields.Str()
    # Populated by the route handler before serialisation.
    url = fields.Str()


photo_schema = PhotoOutSchema()
photos_schema = PhotoOutSchema(many=True)

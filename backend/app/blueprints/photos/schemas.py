from marshmallow import Schema, fields


class PhotoOutSchema(Schema):
    """Shape returned to the client for a single photo.

    `storage_key` is intentionally NOT exposed — clients address photos by
    `id` only and fetch bytes via GET /api/photos/<id>.
    """
    id = fields.Int()
    ticket_id = fields.Int()
    uploaded_by = fields.Int()
    submission_uuid = fields.Str()
    mime_type = fields.Str()
    byte_size = fields.Int()
    content_hash = fields.Str()
    exif_lat = fields.Float(allow_none=True)
    exif_lng = fields.Float(allow_none=True)
    created_at = fields.DateTime()
    # Populated by the route handler before serialisation.
    url = fields.Str()


photo_schema = PhotoOutSchema()
photos_schema = PhotoOutSchema(many=True)

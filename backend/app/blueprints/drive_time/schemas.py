from app.extensions import ma
from app.models import DutySessions, DutyLogs
from marshmallow import fields, Schema, validate


class DutyLogSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = DutyLogs
        include_fk = True


class DutySessionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = DutySessions
        include_fk = True

    logs = fields.Nested(DutyLogSchema, many=True, dump_only=True)


class StatusChangeSchema(Schema):
    """Payload for POST /drive-time/status — change the contractor's duty status.

    Fields:
        status    — required, must be one of the four FMCSA duty statuses.
        timestamp — optional ISO-8601 UTC string supplied by the frontend.
                    Use this when syncing offline status changes so the real
                    event time is preserved instead of the server's receive time.
                    Falls back to datetime.now(UTC) on the server if omitted.
    """
    status = fields.Str(
        required=True,
        validate=validate.OneOf(["driving", "on_duty", "off_duty", "sleeper_berth"]),
    )
    timestamp = fields.DateTime(
        load_default=None,
        metadata={"description": "Client-side event time (UTC). Omit to use server time."},
    )


duty_log_schema = DutyLogSchema()
duty_logs_schema = DutyLogSchema(many=True)
duty_session_schema = DutySessionSchema()
status_change_schema = StatusChangeSchema()

from app.extensions import ma
from app.models import DutySessions, DutyLogs
from marshmallow import fields, Schema


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
    """Payload for POST /drive-time/status — change the contractor's duty status."""
    status = fields.Str(required=True)  # driving, on_duty, off_duty, sleeper_berth


duty_log_schema = DutyLogSchema()
duty_logs_schema = DutyLogSchema(many=True)
duty_session_schema = DutySessionSchema()
status_change_schema = StatusChangeSchema()

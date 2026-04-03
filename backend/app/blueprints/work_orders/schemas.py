from marshmallow import Schema, fields, validate

from app.extensions import ma
from app.models import Work_orders


class WorkOrderSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Work_orders
        include_fk = True


class WorkOrderStatusUpdateSchema(Schema):
    status = fields.Str(
        required=True,
        validate=validate.OneOf(["accepted", "declined"]),
    )


work_order_schema = WorkOrderSchema()
work_order_status_update_schema = WorkOrderStatusUpdateSchema()

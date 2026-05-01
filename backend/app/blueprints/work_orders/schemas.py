from marshmallow import Schema, fields, validate

from app.extensions import ma
from app.models import Work_order


class WorkOrderSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Work_order
        include_fk = True


work_order_schema = WorkOrderSchema()

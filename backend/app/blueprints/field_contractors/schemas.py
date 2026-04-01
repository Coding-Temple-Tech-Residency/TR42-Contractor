from marshmallow_sqlalchemy import auto_field

from app.extensions import ma
from app.models import Contractors
from marshmallow import fields, Schema

class ContractorSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Contractors
        include_fk = True
    id = auto_field(dump_only=True)

class ContractorUpdateSchema(Schema):
    contact_number = fields.Str(required=False)
    address = fields.Str(required=False)

class VendorUpdateContractorSchema(Schema):
    vendor_id = fields.Int(required=False)
    manager_id = fields.Int(required=False)
    license_number = fields.Str(required=False)
    expiration_date = fields.Date(required=False)
    contractor_type = fields.Str(required=False)
    tax_classification = fields.Str(required=False)
    contact_number = fields.Str(required=False)
    date_of_birth = fields.Date(required=False)
    address = fields.Str(required=False)

contractor_schema = ContractorSchema()
contractor_update_schema = ContractorUpdateSchema()
vendor_update_contractor_schema = VendorUpdateContractorSchema()
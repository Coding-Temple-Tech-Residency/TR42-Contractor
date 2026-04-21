from marshmallow_sqlalchemy import auto_field

from app.extensions import ma
from app.models import Contractor
from marshmallow import fields, Schema

class ContractorSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Contractor
        include_fk = True
    id = auto_field(dump_only=True)

class ContractorUpdateSchema(Schema):
    offline_pin = fields.Str(required=False) #this is for contractor to set or update their offline pin, which will be used for biometric authentication fallback

# class VendorUpdateContractorSchema(Schema):



contractor_schema = ContractorSchema()
contractor_update_schema = ContractorUpdateSchema()
# vendor_update_contractor_schema = VendorUpdateContractorSchema()
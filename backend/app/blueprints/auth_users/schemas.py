from app.extensions import ma
from app.models import AuthUser
from marshmallow import fields, Schema

class AuthUserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = AuthUser
        load_only = ("password_hash",)
        include_fk = True

class AuthUserCreateSchema(Schema):
    username = fields.Str(required=True)
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)
    first_name = fields.Str(required=True)
    last_name = fields.Str(required=True)
    middle_name = fields.Str(required=False)
    profile_photo = fields.Str(required=False)
    contact_number = fields.Str(required=True)
    alternate_number = fields.Str(required=False)
    date_of_birth = fields.Date(required=True)
    ssn_last_four = fields.Str(required=True)

class LoginSchema(Schema):
    # `identifier` is the preferred field — the frontend sends whatever the
    # contractor typed (username OR email) and the route handler decides
    # which column to look up. `username` and `email` are kept for backward
    # compatibility with older clients / test scripts; at least one of the
    # three must be present, validated in the route.
    identifier = fields.Str(required=False)
    username = fields.Str(required=False)
    email = fields.Str(required=False)
    password = fields.Str(required=True)

class AuthUserUpdateSchema(Schema):
    email = fields.Email(required=False)
    contact_number = fields.Str(required=False)
    alternative_contact_number = fields.Str(required=False)
#ex. use in contractor update routes

class AuthUserUpdatePasswordSchema(Schema):
    current_password = fields.Str(required=True)
    new_password = fields.Str(required=True)

# Offline PIN schema 
class OfflinePinSchema(Schema):
    pin = fields.Str(required=True)


auth_user_schema = AuthUserSchema()
auth_user_create_schema = AuthUserCreateSchema()
login_schema = LoginSchema()
auth_user_update_schema = AuthUserUpdateSchema()

auth_user_update_password_schema = AuthUserUpdatePasswordSchema()
offline_pin_schema = OfflinePinSchema()


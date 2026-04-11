from app.extensions import ma
from app.models import Auth_users
from marshmallow import fields, Schema

class AuthUserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Auth_users
        load_only = ("password",)
        include_fk = True

class LoginSchema(Schema):
    username = fields.Str(required=True)
    password = fields.Str(required=True)

class AuthUserUpdateSchema(Schema):
    email = fields.Email(required=False)
#ex. use in contractor update routes

class AuthUserCreateSchema(AuthUserSchema):
    role = fields.Str(required=False) #this is to not have role be taken from request body when creating user
    created_by = fields.Int(required=False) #this will be derived from the token of the user creating the new user, not from request body

class AuthUserUpdatePasswordSchema(Schema):
    current_password = fields.Str(required=True)
    new_password = fields.Str(required=True)

# Offline PIN schema 
class OfflinePinSchema(Schema):
    pin = fields.Str(required=True)


auth_user_schema = AuthUserSchema()
login_schema = LoginSchema()
auth_user_update_schema = AuthUserUpdateSchema()

auth_user_create_schema = AuthUserCreateSchema() 
auth_user_update_password_schema = AuthUserUpdatePasswordSchema()
offline_pin_schema = OfflinePinSchema()


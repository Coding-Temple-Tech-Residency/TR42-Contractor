"""SQLAlchemy models for the TR42 Contractor backend.

Source of truth: the team's shared Supabase Postgres (Field Force project,
ref `zatumiuotungelnicuhj`). This file mirrors the live schema as of the
4/29 ERD lock, with the following conventions:

PRIMARY KEYS
    Every table uses a text/UUID primary key (column type `text` in Postgres,
    `String` in SQLAlchemy). UUIDs are generated in the application layer via
    `default=_new_uuid` so we don't depend on the DB having a default set.

ENUMS
    Postgres has 20+ ENUM types in this DB. We model them as plain `String`
    columns and let Postgres enforce the constraint. This keeps Python code
    free of long Enum classes and avoids the SQLAlchemy/Alembic Enum churn
    that bites every time someone adds a value.

BYTEA
    `bytea` columns are mapped to `LargeBinary`. Used for photos, biometric
    enrollment templates, MSA PDFs, and message file attachments.

TIMESTAMPS
    Audit fields (`created_at`, `updated_at`, `created_by`, `updated_by`)
    repeat on almost every table. They're inlined per-class rather than
    pulled into a mixin; the verbosity is worth it for IDE autocomplete and
    for keeping each model self-contained when you're scanning the file.

LOCAL-ONLY MODELS
    `DutySessions`, `DutyLogs`, and `AiInspectionReports` exist in this file
    but NOT in Supabase. They're used by the `drive_time` and `ai` blueprints
    against the local sqlite DB only. Marked with a comment so future schema
    syncs don't accidentally drop them.

CIRCULAR FK
    `auth_user.address_id` <-> `address.created_by` is a circular dependency.
    We resolve it with `use_alter=True` on the address-side FKs so SQLAlchemy
    can defer the constraint creation.
"""
import uuid
from datetime import date, datetime, timezone

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import (
    Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, Interval,
    JSON, LargeBinary, Numeric, String, Table, Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def _new_uuid() -> str:
    """Generate a fresh UUIDv4 string for a primary key."""
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    """Lambda-friendly default for created_at columns. Evaluated per row."""
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)


# ── Identity & access ─────────────────────────────────────────────────────────

class AuthUser(Base):
    __tablename__ = 'auth_user'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    username: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(400), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    user_type: Mapped[str] = mapped_column(String(50), nullable=False)  # enum: user_type
    token_version: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    profile_photo: Mapped[bytes] = mapped_column(LargeBinary, nullable=True)

    first_name: Mapped[str] = mapped_column(String(80), nullable=True)
    last_name: Mapped[str] = mapped_column(String(80), nullable=True)
    middle_name: Mapped[str] = mapped_column(String(80), nullable=True)
    contact_number: Mapped[str] = mapped_column(String(30), nullable=True)
    alternate_number: Mapped[str] = mapped_column(String(30), nullable=True)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=True)
    ssn_last_four: Mapped[str] = mapped_column(String(4), nullable=True)
    address_id: Mapped[str] = mapped_column(ForeignKey('address.id'), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=True)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=True)

    # Convenience back-refs the existing blueprints rely on.
    contractor = relationship("Contractor", uselist=False, back_populates="auth_user", foreign_keys="Contractor.user_id")


class Address(Base):
    __tablename__ = 'address'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    street: Mapped[str] = mapped_column(Text, nullable=True)
    city: Mapped[str] = mapped_column(Text, nullable=True)
    state: Mapped[str] = mapped_column(String(20), nullable=True)
    zip: Mapped[str] = mapped_column(String(10), nullable=True)
    country: Mapped[str] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    # use_alter on the Address side breaks the auth_user <-> address cycle.
    created_by: Mapped[str] = mapped_column(
        ForeignKey('auth_user.id', use_alter=True, name='address_created_by_fkey'),
        nullable=False,
    )
    updated_by: Mapped[str] = mapped_column(
        ForeignKey('auth_user.id', use_alter=True, name='address_updated_by_fkey'),
        nullable=False,
    )


class Roles(Base):
    __tablename__ = 'roles'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    name: Mapped[str] = mapped_column(Text, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=True)
    client_id: Mapped[str] = mapped_column(ForeignKey('client.id'), nullable=False)


class Permission(Base):
    __tablename__ = 'permission'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    role_id: Mapped[str] = mapped_column(ForeignKey('roles.id'), nullable=False)
    resource: Mapped[str] = mapped_column(Text, nullable=True)
    can_read: Mapped[bool] = mapped_column(Boolean, nullable=True)
    can_write: Mapped[bool] = mapped_column(Boolean, nullable=True)
    can_delete: Mapped[bool] = mapped_column(Boolean, nullable=True)


class UserRole(Base):
    """Composite PK on (user_id, role_id) per Supabase."""
    __tablename__ = 'user_role'

    user_id: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), primary_key=True)
    role_id: Mapped[str] = mapped_column(ForeignKey('roles.id'), primary_key=True)


class Session(Base):
    __tablename__ = 'session'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    last_activity: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    user_agent: Mapped[str] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


# ── Clients & vendors ────────────────────────────────────────────────────────

class Client(Base):
    __tablename__ = 'client'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    client_name: Mapped[str] = mapped_column(Text, nullable=False)
    client_code: Mapped[str] = mapped_column(Text, nullable=False)
    primary_contact_name: Mapped[str] = mapped_column(Text, nullable=False)
    company_email: Mapped[str] = mapped_column(Text, nullable=False)
    company_phone: Mapped[str] = mapped_column(Text, nullable=False)
    company_web_address: Mapped[str] = mapped_column(Text, nullable=True)
    approved_domain: Mapped[str] = mapped_column(Text, nullable=True)
    address_id: Mapped[str] = mapped_column(ForeignKey('address.id'), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class ClientUser(Base):
    __tablename__ = 'client_user'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    client_id: Mapped[str] = mapped_column(ForeignKey('client.id'), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=True)  # enum: client_user_status

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class ClientVendor(Base):
    __tablename__ = 'client_vendor'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    client_id: Mapped[str] = mapped_column(ForeignKey('client.id'), nullable=False)
    vendor_id: Mapped[str] = mapped_column(ForeignKey('vendor.id'), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class Vendor(Base):
    __tablename__ = 'vendor'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    company_name: Mapped[str] = mapped_column(String(80), nullable=False)
    company_code: Mapped[str] = mapped_column(Text, nullable=True)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    primary_contact_name: Mapped[str] = mapped_column(Text, nullable=False)
    company_email: Mapped[str] = mapped_column(Text, nullable=False)
    company_phone: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # enum: vendor_status
    vendor_code: Mapped[str] = mapped_column(Text, nullable=True)
    onboarding: Mapped[bool] = mapped_column(Boolean, nullable=False)
    compliance_status: Mapped[str] = mapped_column(String(50), nullable=True)  # enum: compliance_status
    description: Mapped[str] = mapped_column(Text, nullable=True)
    address_id: Mapped[str] = mapped_column(ForeignKey('address.id'), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class VendorUser(Base):
    __tablename__ = 'vendor_user'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    vendor_id: Mapped[str] = mapped_column(ForeignKey('vendor.id'), nullable=True)
    vendor_user_role: Mapped[str] = mapped_column(String(50), nullable=True)  # enum: role_options

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class VendorUserSetting(Base):
    __tablename__ = 'vendor_user_setting'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    vendor_user_id: Mapped[str] = mapped_column(ForeignKey('vendor_user.id'), nullable=False)
    email_notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    system_alert_notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    fraud_alert_notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    work_order_update_notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    invoice_update_notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


# ── Contractors and contractor lifecycle ─────────────────────────────────────

class Contractor(Base):
    __tablename__ = 'contractor'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    employee_number: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    user_id: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), index=True, nullable=False)
    role: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=True)  # enum: contractor_status
    tickets_completed: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    tickets_open: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    biometric_enrolled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    is_onboarded: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    is_subcontractor: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    is_fte: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    is_licensed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    is_insured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    is_certified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    average_rating: Mapped[float] = mapped_column(Numeric, nullable=True)
    years_experience: Mapped[int] = mapped_column(Integer, nullable=True)
    preferred_job_types: Mapped[dict] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)

    auth_user = relationship("AuthUser", back_populates="contractor", foreign_keys=[user_id])


class ContractorInvite(Base):
    __tablename__ = 'contractor_invite'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    hashed_token: Mapped[str] = mapped_column(Text, nullable=False)
    vendor_id: Mapped[str] = mapped_column(ForeignKey('vendor.id'), nullable=False)
    vendor_manager_id: Mapped[str] = mapped_column(ForeignKey('vendor_user.id'), nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class VendorContractor(Base):
    __tablename__ = 'vendor_contractor'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    contractor_id: Mapped[str] = mapped_column(ForeignKey('contractor.id'), nullable=False)
    vendor_id: Mapped[str] = mapped_column(ForeignKey('vendor.id'), nullable=False)
    manager_id: Mapped[str] = mapped_column(ForeignKey('vendor_user.id'), nullable=False)
    vendor_contractor_role: Mapped[str] = mapped_column(String(50), nullable=False)  # enum

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class BackgroundCheck(Base):
    __tablename__ = 'background_check'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    contractor_id: Mapped[str] = mapped_column(ForeignKey('contractor.id'), nullable=False)
    background_check_passed: Mapped[bool] = mapped_column(Boolean, nullable=True)
    background_check_date: Mapped[date] = mapped_column(Date, nullable=True)
    background_check_provider: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class DrugTest(Base):
    __tablename__ = 'drug_test'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    contractor_id: Mapped[str] = mapped_column(ForeignKey('contractor.id'), nullable=False)
    drug_test_passed: Mapped[bool] = mapped_column(Boolean, nullable=True)
    drug_test_date: Mapped[date] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class BiometricData(Base):
    __tablename__ = 'biometric_data'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    contractor_id: Mapped[str] = mapped_column(ForeignKey('contractor.id'), nullable=False)
    biometric_enrollment_data: Mapped[bytes] = mapped_column(LargeBinary, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class Certification(Base):
    __tablename__ = 'certification'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    contractor_id: Mapped[str] = mapped_column(ForeignKey('contractor.id'), nullable=False)
    certification_name: Mapped[str] = mapped_column(Text, nullable=True)
    certifying_body: Mapped[str] = mapped_column(Text, nullable=True)
    certification_number: Mapped[str] = mapped_column(String(100), nullable=False)
    issue_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expiration_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    certification_document_url: Mapped[str] = mapped_column(String(100), nullable=True)
    certification_verified: Mapped[bool] = mapped_column(Boolean, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class License(Base):
    __tablename__ = 'license'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    contractor_id: Mapped[str] = mapped_column(ForeignKey('contractor.id'), nullable=False)
    license_type: Mapped[str] = mapped_column(String(100), nullable=False)
    license_number: Mapped[str] = mapped_column(String(100), nullable=False)
    license_state: Mapped[str] = mapped_column(String(2), nullable=False)
    license_expiration_date: Mapped[date] = mapped_column(Date, nullable=False)
    license_document_url: Mapped[str] = mapped_column(String(100), nullable=True)
    license_verified: Mapped[bool] = mapped_column(Boolean, nullable=True)
    license_verified_by: Mapped[str] = mapped_column(ForeignKey('vendor_user.id'), nullable=True)
    license_verified_at: Mapped[date] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class Insurance(Base):
    __tablename__ = 'insurance'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    contractor_id: Mapped[str] = mapped_column(ForeignKey('contractor.id'), nullable=True)
    insurance_type: Mapped[str] = mapped_column(Text, nullable=False)
    policy_number: Mapped[str] = mapped_column(String(100), nullable=False)
    provider_name: Mapped[str] = mapped_column(Text, nullable=False)
    provider_phone: Mapped[str] = mapped_column(Text, nullable=False)
    coverage_amount: Mapped[float] = mapped_column(Numeric, nullable=True)
    deductible: Mapped[float] = mapped_column(Numeric, nullable=True)
    effective_date: Mapped[date] = mapped_column(Date, nullable=True)
    expiration_date: Mapped[date] = mapped_column(Date, nullable=True)
    insurance_document_url: Mapped[str] = mapped_column(String(100), nullable=True)
    insurance_verified: Mapped[bool] = mapped_column(Boolean, nullable=False)
    additional_insurance_required: Mapped[bool] = mapped_column(Boolean, nullable=True)
    additional_insured_certificate_url: Mapped[str] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


# ── Compliance & contracts ───────────────────────────────────────────────────

class ComplianceDocument(Base):
    __tablename__ = 'compliance_document'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    vendor_id: Mapped[str] = mapped_column(ForeignKey('vendor.id'), nullable=False)
    compliance_document: Mapped[bytes] = mapped_column(LargeBinary, nullable=True)
    compliance_status: Mapped[bool] = mapped_column(Boolean, nullable=False)
    expiration_date: Mapped[date] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class Msa(Base):
    __tablename__ = 'msa'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    vendor_id: Mapped[str] = mapped_column(ForeignKey('vendor.id'), nullable=False)
    version: Mapped[str] = mapped_column(String(10), nullable=True)
    effective_date: Mapped[date] = mapped_column(Date, nullable=True)
    expiration_date: Mapped[date] = mapped_column(Date, nullable=True)
    file_name: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(15), nullable=False)
    uploaded_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class MsaRequirement(Base):
    __tablename__ = 'msa_requirement'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    msa_id: Mapped[str] = mapped_column(ForeignKey('msa.id'), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=True)
    rule_type: Mapped[str] = mapped_column(String(50), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    value: Mapped[str] = mapped_column(String(100), nullable=True)
    unit: Mapped[str] = mapped_column(String(100), nullable=True)
    source_field_id: Mapped[str] = mapped_column(Text, nullable=True)
    page_number: Mapped[int] = mapped_column(Integer, nullable=True)
    extracted_text: Mapped[str] = mapped_column(Text, nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=True)
    metadata_json: Mapped[dict] = mapped_column('metadata', JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


# ── Services & wells ─────────────────────────────────────────────────────────

class Service(Base):
    __tablename__ = 'service'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    service: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class VendorService(Base):
    __tablename__ = 'vendor_service'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    vendor_id: Mapped[str] = mapped_column(ForeignKey('vendor.id'), nullable=False)
    service_id: Mapped[str] = mapped_column(ForeignKey('service.id'), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class Well(Base):
    __tablename__ = 'well'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    api_number: Mapped[str] = mapped_column(Text, nullable=False)
    well_name: Mapped[str] = mapped_column(Text, nullable=False)
    client_id: Mapped[str] = mapped_column(ForeignKey('client.id'), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=True)  # enum: well_status
    type: Mapped[str] = mapped_column(String(50), nullable=True)    # enum: well_type
    range: Mapped[str] = mapped_column(String(2), nullable=True)
    quarter: Mapped[str] = mapped_column(String(2), nullable=True)
    ground_elevation: Mapped[int] = mapped_column(Integer, nullable=True)
    total_depth: Mapped[int] = mapped_column(Integer, nullable=True)
    geofence_radius: Mapped[int] = mapped_column(Integer, nullable=True)
    spud_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    completion_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    access_instructions: Mapped[str] = mapped_column(Text, nullable=True)
    safety_notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class WellLocation(Base):
    __tablename__ = 'well_location'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    well_id: Mapped[str] = mapped_column(ForeignKey('well.id'), nullable=False)
    surface_latitude: Mapped[float] = mapped_column(Numeric, nullable=True)
    surface_longitude: Mapped[float] = mapped_column(Numeric, nullable=True)
    bottom_latitude: Mapped[float] = mapped_column(Numeric, nullable=True)
    bottom_longitude: Mapped[float] = mapped_column(Numeric, nullable=True)
    county: Mapped[str] = mapped_column(Text, nullable=True)
    state: Mapped[str] = mapped_column(String(2), nullable=True)
    field_name: Mapped[str] = mapped_column(Text, nullable=True)
    section: Mapped[int] = mapped_column(Integer, nullable=True)
    township: Mapped[str] = mapped_column(String(2), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class VendorWell(Base):
    __tablename__ = 'vendor_well'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    vendor_id: Mapped[str] = mapped_column(ForeignKey('vendor.id'), nullable=False)
    well_id: Mapped[str] = mapped_column(ForeignKey('well.id'), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


# ── Work orders, tickets, deliveries ─────────────────────────────────────────

class Work_order(Base):
    """Class name kept as `Work_order` (not `WorkOrder`) to preserve import
    paths in the existing `work_orders` blueprint."""
    __tablename__ = 'work_order'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    assigned_vendor: Mapped[str] = mapped_column(ForeignKey('vendor.id'), nullable=True)
    client_id: Mapped[str] = mapped_column(ForeignKey('client.id'), nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    halted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    work_order_code: Mapped[int] = mapped_column(Integer, nullable=True)
    estimated_start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    estimated_end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    current_status: Mapped[str] = mapped_column(String(50), nullable=False)  # enum: order_status
    comments: Mapped[str] = mapped_column(String(500), nullable=True)
    location: Mapped[str] = mapped_column(String(100), nullable=True)
    location_type: Mapped[str] = mapped_column(String(50), nullable=True)  # enum: location_type
    latitude: Mapped[float] = mapped_column(Numeric, nullable=True)
    longitude: Mapped[float] = mapped_column(Numeric, nullable=True)
    estimated_cost: Mapped[float] = mapped_column(Numeric, nullable=True)
    estimated_duration: Mapped[Interval] = mapped_column(Interval, nullable=True)
    priority: Mapped[str] = mapped_column(String(50), nullable=False)  # enum: priority_status
    well_id: Mapped[str] = mapped_column(ForeignKey('well.id'), nullable=True)
    service_type: Mapped[str] = mapped_column(ForeignKey('service.id'), nullable=False)
    estimated_quantity: Mapped[float] = mapped_column(Float, nullable=True)
    units: Mapped[str] = mapped_column(String(15), nullable=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    recurrence_type: Mapped[str] = mapped_column(String(50), nullable=True)  # enum: frequency_type
    cancelled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    cancellation_reason: Mapped[str] = mapped_column(Text, nullable=True)
    cancelled_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class Ticket(Base):
    __tablename__ = 'ticket'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    work_order_id: Mapped[str] = mapped_column(ForeignKey('work_order.id'), index=True, nullable=False)
    invoice_id: Mapped[str] = mapped_column(ForeignKey('invoice.id'), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    assigned_contractor: Mapped[str] = mapped_column(ForeignKey('contractor.id'), nullable=True)
    priority: Mapped[str] = mapped_column(String(50), nullable=False)  # enum: priority_status
    status: Mapped[str] = mapped_column(String(50), nullable=False)    # enum: order_status
    vendor_id: Mapped[str] = mapped_column(ForeignKey('vendor.id'), index=True, nullable=False)

    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    estimated_duration: Mapped[Interval] = mapped_column(Interval, nullable=True)
    service_type: Mapped[str] = mapped_column(ForeignKey('service.id'), nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    contractor_start_latitude: Mapped[float] = mapped_column(Numeric, nullable=True)
    contractor_start_longitude: Mapped[float] = mapped_column(Numeric, nullable=True)
    contractor_end_latitude: Mapped[float] = mapped_column(Numeric, nullable=True)
    contractor_end_longitude: Mapped[float] = mapped_column(Numeric, nullable=True)
    estimated_quantity: Mapped[float] = mapped_column(Float, nullable=True)
    unit: Mapped[str] = mapped_column(Text, nullable=True)
    special_requirements: Mapped[str] = mapped_column(Text, nullable=True)
    anomaly_flag: Mapped[bool] = mapped_column(Boolean, default=False, nullable=True)
    anomaly_reason: Mapped[str] = mapped_column(Text, nullable=True)
    additional_information: Mapped[dict] = mapped_column(JSON, nullable=True)
    route: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class TicketPhoto(Base):
    """Photos uploaded by a contractor against a ticket they're assigned to.

    Bytes live in `photo_content` (bytea) per the team's storage decision.
    `submission_uuid` and `content_hash` were added by Daniel via SQL editor
    after the initial schema was set, to support idempotent retries from the
    mobile offline queue.
    """
    __tablename__ = 'ticket_photo'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    ticket_id: Mapped[str] = mapped_column(ForeignKey('ticket.id'), nullable=False, index=True)
    photo_content: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    latitude: Mapped[float] = mapped_column(Numeric, nullable=True)
    longitude: Mapped[float] = mapped_column(Numeric, nullable=True)
    uploaded_by: Mapped[str] = mapped_column(ForeignKey('contractor.id'), nullable=False, index=True)

    # Offline retry safety. submission_uuid is generated by the mobile app at
    # capture time; backend upserts on it so retries collapse onto the same row.
    # content_hash is sha256 of photo_content for app-level dedup + audit.
    submission_uuid: Mapped[str] = mapped_column(Text, nullable=True, unique=True)
    content_hash: Mapped[str] = mapped_column(Text, nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)

    ticket = relationship("Ticket")


class ContractorPerformance(Base):
    __tablename__ = 'contractor_performance'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    contractor_id: Mapped[str] = mapped_column(ForeignKey('contractor.id'), nullable=False)
    ticket_id: Mapped[str] = mapped_column(ForeignKey('ticket.id'), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comments: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class RegisteredDevice(Base):
    __tablename__ = 'registered_device'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    contractor_id: Mapped[str] = mapped_column(ForeignKey('contractor.id'), nullable=False)
    device_name: Mapped[str] = mapped_column(String(100), nullable=True)
    device_type: Mapped[str] = mapped_column(String(50), nullable=True)  # enum: device_types
    first_registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    last_used_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    biometric_enabled_on_device: Mapped[bool] = mapped_column(Boolean, nullable=True)
    notification_preferences: Mapped[dict] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class TicketSession(Base):
    """A contractor's session against a single ticket, capturing check-in,
    check-out, location, and acceptance state."""
    __tablename__ = 'ticket_session'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    contractor_id: Mapped[str] = mapped_column(ForeignKey('contractor.id'), nullable=False)
    ticket_id: Mapped[str] = mapped_column(ForeignKey('ticket.id'), nullable=False)
    device_id: Mapped[str] = mapped_column(ForeignKey('registered_device.id'), nullable=True)
    check_in_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    check_out_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    ticket_accepted: Mapped[bool] = mapped_column(Boolean, nullable=True)
    ticket_declined: Mapped[bool] = mapped_column(Boolean, nullable=True)
    ticket_completed: Mapped[bool] = mapped_column(Boolean, nullable=True)
    # Note the typo `latitiude` matches Supabase exactly. Don't "fix" it without
    # coordinating with Daniel; the column name in the live DB is misspelled.
    latitiude: Mapped[float] = mapped_column(Numeric, nullable=True)
    longitude: Mapped[float] = mapped_column(Numeric, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    duration: Mapped[Interval] = mapped_column(Interval, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class Delivery(Base):
    __tablename__ = 'delivery'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey('ticket_session.id'), nullable=False)
    delivery_ticket_number: Mapped[str] = mapped_column(String(50), nullable=True)
    delivery_date: Mapped[date] = mapped_column(Date, nullable=True)
    delivery_time: Mapped[str] = mapped_column(Text, nullable=True)  # time without tz
    delivery_company: Mapped[str] = mapped_column(String(50), nullable=True)
    driver_name: Mapped[str] = mapped_column(String(60), nullable=True)
    vehicle_license: Mapped[str] = mapped_column(String(60), nullable=True)
    delivery_condition: Mapped[str] = mapped_column(String(20), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class FieldNote(Base):
    __tablename__ = 'field_note'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey('ticket_session.id'), nullable=False)
    note_text: Mapped[str] = mapped_column(Text, nullable=False)
    note_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    note_latitude: Mapped[float] = mapped_column(Numeric, nullable=True)
    note_longitude: Mapped[float] = mapped_column(Numeric, nullable=True)
    note_category: Mapped[str] = mapped_column(String(50), nullable=True)  # enum: note_categories

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class Issue(Base):
    __tablename__ = 'issue'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey('ticket_session.id'), nullable=False)
    issue_title: Mapped[str] = mapped_column(String(100), nullable=False)
    issue_description: Mapped[str] = mapped_column(Text, nullable=True)
    issue_category: Mapped[str] = mapped_column(String(50), nullable=True)  # enum: issue_categories
    issue_severity: Mapped[str] = mapped_column(String(50), nullable=False)  # enum: issue_severities

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class Submission(Base):
    __tablename__ = 'submission'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey('ticket_session.id'), nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    submission_status: Mapped[str] = mapped_column(String(50), nullable=True)
    submission_package_url: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


# ── Billing ───────────────────────────────────────────────────────────────────

class Invoice(Base):
    __tablename__ = 'invoice'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    work_order_id: Mapped[str] = mapped_column(ForeignKey('work_order.id'), nullable=False)
    vendor_id: Mapped[str] = mapped_column(ForeignKey('vendor.id'), nullable=False)
    client_id: Mapped[str] = mapped_column(ForeignKey('client.id'), nullable=False)
    invoice_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    total_amount: Mapped[float] = mapped_column(Numeric, nullable=False)
    invoice_status: Mapped[str] = mapped_column(String(50), nullable=False)  # enum: invoice_statuses
    paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class LineItem(Base):
    __tablename__ = 'line_item'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    invoice_id: Mapped[str] = mapped_column(ForeignKey('invoice.id'), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    rate: Mapped[float] = mapped_column(Numeric, nullable=False)
    amount: Mapped[float] = mapped_column(Numeric, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class FraudAlert(Base):
    __tablename__ = 'fraud_alert'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    work_order_id: Mapped[str] = mapped_column(ForeignKey('work_order.id'), nullable=True)
    ticket_id: Mapped[str] = mapped_column(ForeignKey('ticket.id'), nullable=True)
    invoice_id: Mapped[str] = mapped_column(ForeignKey('invoice.id'), nullable=True)
    severity: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    flagged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


# ── Comms ─────────────────────────────────────────────────────────────────────

class Notification(Base):
    __tablename__ = 'notification'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    recipient: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    level: Mapped[str] = mapped_column(String(50), nullable=False)  # enum: notification_level

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class Chat(Base):
    __tablename__ = 'chat'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    user_one_id: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    user_two_id: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class Message(Base):
    __tablename__ = 'message'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    chat_id: Mapped[str] = mapped_column(ForeignKey('chat.id'), nullable=False)
    sender_id: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    recipient_id: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


class FileAttachment(Base):
    __tablename__ = 'file_attachment'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    message_id: Mapped[str] = mapped_column(ForeignKey('message.id'), nullable=False)
    filename: Mapped[str] = mapped_column(Text, nullable=False)
    mime_type: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)


# ── Inspections (in Supabase) ─────────────────────────────────────────────────

class InspectionTemplate(Base):
    __tablename__ = 'inspection_template'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)

    sections = relationship("InspectionSection", back_populates="template", order_by="InspectionSection.display_order")


class InspectionSection(Base):
    __tablename__ = 'inspection_section'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    template_id: Mapped[str] = mapped_column(ForeignKey('inspection_template.id'), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)

    template = relationship("InspectionTemplate", back_populates="sections")
    items = relationship("InspectionItem", back_populates="section", order_by="InspectionItem.display_order")


class InspectionItem(Base):
    __tablename__ = 'inspection_item'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    section_id: Mapped[str] = mapped_column(ForeignKey('inspection_section.id'), nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)

    section = relationship("InspectionSection", back_populates="items")


class Inspection(Base):
    __tablename__ = 'inspection'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    template_id: Mapped[str] = mapped_column(ForeignKey('inspection_template.id'), nullable=False)
    contractor_id: Mapped[str] = mapped_column(ForeignKey('contractor.id'), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # enum: inspection_status
    no_issues_found: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    skipped: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)

    template = relationship("InspectionTemplate")
    results = relationship("InspectionResult", back_populates="inspection")


class InspectionResult(Base):
    __tablename__ = 'inspection_result'

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_new_uuid)
    inspection_id: Mapped[str] = mapped_column(ForeignKey('inspection.id'), nullable=False)
    item_id: Mapped[str] = mapped_column(ForeignKey('inspection_item.id'), nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)
    updated_by: Mapped[str] = mapped_column(ForeignKey('auth_user.id'), nullable=False)

    inspection = relationship("Inspection", back_populates="results")
    item = relationship("InspectionItem")


# ── Backward-compat aliases for existing blueprint imports ───────────────────
# The inspections blueprint imports `InspectionTemplates`, `InspectionSections`,
# etc. (plural). Keep aliases so we don't have to touch every blueprint in this
# pass.
InspectionTemplates = InspectionTemplate
InspectionSections = InspectionSection
InspectionItems = InspectionItem
Inspections = Inspection
InspectionResults = InspectionResult


# ── Local-only models (NOT in Supabase) ──────────────────────────────────────
# These live only in the local sqlite dev DB. They support the drive_time and
# ai blueprints which haven't been promoted to the shared schema yet.
# Keep these here so future Supabase syncs don't accidentally delete them.

class DutySessions(Base):
    """A contractor's duty session for a given day / shift. Local-only."""
    __tablename__ = 'duty_sessions'

    id: Mapped[int] = mapped_column(primary_key=True)
    contractor_id: Mapped[str] = mapped_column(String, nullable=False)
    current_status: Mapped[str] = mapped_column(String(20), nullable=False, default='off_duty')
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    ended_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    logs = relationship("DutyLogs", back_populates="session", order_by="DutyLogs.start_time")


class DutyLogs(Base):
    """A single duty segment within a session. Local-only."""
    __tablename__ = 'duty_logs'

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey('duty_sessions.id'), nullable=False)
    contractor_id: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    session = relationship("DutySessions", back_populates="logs")


class AiInspectionReports(Base):
    """AI-generated inspection report saved by a contractor. Local-only."""
    __tablename__ = 'ai_inspection_reports'

    id: Mapped[int] = mapped_column(primary_key=True)
    contractor_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    inspection_id: Mapped[str] = mapped_column(String, nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    priority: Mapped[str] = mapped_column(String(20), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(2000), nullable=False)
    recommended_actions: Mapped[str] = mapped_column(String(3000), nullable=False)
    raw_notes: Mapped[str] = mapped_column(String(2000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import Date, String, Integer, Float, ForeignKey, Table, Column, Boolean, DateTime
from datetime import date, datetime, timezone

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

class AuthUser(Base):
    __tablename__ = 'authuser'

    id: Mapped[int] = mapped_column(primary_key = True)
    email: Mapped[str] = mapped_column(String(360), nullable=False, unique=True)
    username: Mapped[str] = mapped_column(String(360), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(500), nullable=False)
    user_type: Mapped[str] = mapped_column(String(360), nullable=False)  # vendor, client, contractor
    
    token_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    profile_photo: Mapped[str] = mapped_column(String(500), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc),   nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey('authuser.id'), nullable=True)
    updated_by: Mapped[int] = mapped_column(ForeignKey('authuser.id'), nullable=True)

    first_name: Mapped[str] = mapped_column(String(360), nullable=False)
    last_name: Mapped[str] = mapped_column(String(360), nullable=False)
    middle_name: Mapped[str] = mapped_column(String(360), nullable=True)
    contact_number: Mapped[str] = mapped_column(String(20), nullable=False)
    alternate_number: Mapped[str] = mapped_column(String(20), nullable=True)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    ssn_last_four: Mapped[str] = mapped_column(String(4), nullable=True)
    address_id: Mapped[int] = mapped_column(ForeignKey('address.id'), nullable=False)


    contractor = relationship("Contractor", uselist=False, back_populates="authuser", foreign_keys="Contractor.user_id")
    # vendor = relationship("Vendor", uselist=False, back_populates="authuser", foreign_keys="Vendor.id")
    # client = relationship("Client", uselist=False, back_populates="authuser", foreign_keys="Client.id")

class Contractor(Base):
    __tablename__ = 'contractor'

    id: Mapped[int] = mapped_column(primary_key = True)
    employee_number: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('authuser.id'), index=True, nullable=False)
   
    role: Mapped[str] = mapped_column(String(360), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    tickets_completed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tickets_open: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    biometric_enrolled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_onboarded: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_subcontractor: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_fte: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_licensed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_insured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_certified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    average_rating: Mapped[float] = mapped_column(Float, nullable=True)
    years_experience: Mapped[int] = mapped_column(Integer, nullable=True)
    preferred_job_types: Mapped[str] = mapped_column(String(500), nullable=True)
    
    offline_pin: Mapped[str] = mapped_column(String(10), nullable=True) #add to erd
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey('authuser.id'), nullable=False)
    updated_by: Mapped[int] = mapped_column(ForeignKey('authuser.id'), nullable=True)

    authuser = relationship("AuthUser", back_populates="contractor", foreign_keys=[user_id])



class Work_order(Base):
    __tablename__ = 'work_order'

    id: Mapped[int] = mapped_column(primary_key = True)
    assigned_vendor: Mapped[int] = mapped_column(ForeignKey('vendor.id'), nullable=False)
    client_id: Mapped[int] = mapped_column(ForeignKey('client.id'), nullable=False)
    
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    halted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    
    work_order_code: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_start_date: Mapped[date] = mapped_column(Date, nullable=False)
    estimated_end_date: Mapped[date] = mapped_column(Date, nullable=False)
    current_status: Mapped[str] = mapped_column(String(360), nullable=False)

    location: Mapped[str] = mapped_column(String(500), nullable=False)
    location_type: Mapped[str] = mapped_column(String(360), nullable=False) #there are types
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)

    estimated_cost: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_duration: Mapped[float] = mapped_column(Float, nullable=False)
    priority: Mapped[str] = mapped_column(String(360), nullable=False)

    comments: Mapped[str] = mapped_column(String(500), nullable=True)
    well_id: Mapped[int] = mapped_column(Integer, nullable=True) #shows type of location information
    service_type: Mapped[str] = mapped_column(String(360), nullable=True)
    estimated_quantity: Mapped[float] = mapped_column(Float, nullable=True)
    units: Mapped[str] = mapped_column(String(360), nullable=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    recurrence_type: Mapped[str] = mapped_column(String(360), nullable=True)
    cancelled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_by: Mapped[int] = mapped_column(ForeignKey('authuser.id'), nullable=True)
    cancellation_reason: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey('authuser.id'), nullable=False)
    updated_by: Mapped[int] = mapped_column(ForeignKey('authuser.id'), nullable=True)



class Ticket(Base):
    __tablename__ = 'ticket'

    id: Mapped[int] = mapped_column(primary_key = True)
    work_order_id: Mapped[int] = mapped_column(ForeignKey('work_order.id'), index=True, nullable=False)
    invoice_id: Mapped[int] = mapped_column(Integer, nullable=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey('vendor.id'), index=True, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    priority: Mapped[str] = mapped_column(String(360), nullable=False)
    status: Mapped[str] = mapped_column(String(360), nullable=False) #ex. UNASSIGNED, ASSIGNED, IN_PROGRESS, COMPLETED, PENDING_APPROVAL, APPROVED, REJECTED

    assigned_contractor: Mapped[int] = mapped_column(ForeignKey('contractor.id'))
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True)) #change to assigned_at

    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    contractor_start_latitude: Mapped[float] = mapped_column(Float, nullable=True)
    contractor_start_longitude: Mapped[float] = mapped_column(Float, nullable=True)
    contractor_end_latitude: Mapped[float] = mapped_column(Float, nullable=True)
    contractor_end_longitude: Mapped[float] = mapped_column(Float, nullable=True)
    route: Mapped[str] = mapped_column(String(500), nullable=True)
    
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    estimated_duration: Mapped[float] = mapped_column(Float, nullable=True)
    service_type: Mapped[str] = mapped_column(String(360), nullable=True)

    estimated_quantity: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(360))
    special_requirements: Mapped[str] = mapped_column(String(500))
    
    notes: Mapped[str] = mapped_column(String(500), nullable=True) #notes left behind by contractor when updating
    anomaly_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    anomaly_reason: Mapped[str] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey('authuser.id'), nullable=False)
    updated_by: Mapped[int] = mapped_column(ForeignKey('authuser.id'), nullable=True)
    additional_information: Mapped[str] = mapped_column(String(500), nullable=True)




# ── Inspection models ─────────────────────────────────────────────────────────
# Checklist sections and items are stored in the DB so vendor/admins can
# configure them dynamically — no code changes needed to add a new section.

class InspectionTemplates(Base):
    """A named checklist template (e.g. 'Truck Pre-Trip Inspection')."""
    __tablename__ = 'inspection_templates'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc), nullable=False)

    sections = relationship("InspectionSections", back_populates="template", order_by="InspectionSections.display_order")


class InspectionSections(Base):
    """A section within a template (e.g. 'Engine Compartment', 'Lights Check')."""
    __tablename__ = 'inspection_sections'

    id: Mapped[int] = mapped_column(primary_key=True)
    template_id: Mapped[int] = mapped_column(ForeignKey('inspection_templates.id'), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    template = relationship("InspectionTemplates", back_populates="sections")
    items = relationship("InspectionItems", back_populates="section", order_by="InspectionItems.display_order")


class InspectionItems(Base):
    """An individual check within a section (e.g. 'Check oil level')."""
    __tablename__ = 'inspection_items'

    id: Mapped[int] = mapped_column(primary_key=True)
    section_id: Mapped[int] = mapped_column(ForeignKey('inspection_sections.id'), nullable=False)
    label: Mapped[str] = mapped_column(String(300), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    section = relationship("InspectionSections", back_populates="items")


class Inspections(Base):
    """A completed (or in-progress) inspection by a contractor."""
    __tablename__ = 'inspections'

    id: Mapped[int] = mapped_column(primary_key=True)
    template_id: Mapped[int] = mapped_column(ForeignKey('inspection_templates.id'), nullable=False)
    contractor_id: Mapped[int] = mapped_column(ForeignKey('contractor.id'), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default='pending')  # pending, passed, failed, skipped
    no_issues_found: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    skipped: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc), nullable=False)
    notes: Mapped[str] = mapped_column(String(1000), nullable=True)

    template = relationship("InspectionTemplates")
    results = relationship("InspectionResults", back_populates="inspection")


class InspectionResults(Base):
    """Per-item result for an inspection (passed or failed + optional note)."""
    __tablename__ = 'inspection_results'

    id: Mapped[int] = mapped_column(primary_key=True)
    inspection_id: Mapped[int] = mapped_column(ForeignKey('inspections.id'), nullable=False)
    item_id: Mapped[int] = mapped_column(ForeignKey('inspection_items.id'), nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    note: Mapped[str] = mapped_column(String(500), nullable=True)

    inspection = relationship("Inspections", back_populates="results")
    item = relationship("InspectionItems")


# ── Drive Time / Hours of Service models ──────────────────────────────────────
# FMCSA-style duty status tracking. A DutySession represents a shift (from
# first status change to end-of-day). DutyLogs are the individual segments
# within that session (driving, on-duty, off-duty, sleeper-berth).

class DutySessions(Base):
    """A contractor's duty session for a given day / shift."""
    __tablename__ = 'duty_sessions'

    id: Mapped[int] = mapped_column(primary_key=True)
    contractor_id: Mapped[int] = mapped_column(ForeignKey('contractor.id'), nullable=False)
    current_status: Mapped[str] = mapped_column(String(20), nullable=False, default='off_duty')  # driving, on_duty, off_duty, sleeper_berth
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc), nullable=False)
    ended_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc), nullable=False)

    logs = relationship("DutyLogs", back_populates="session", order_by="DutyLogs.start_time")


class DutyLogs(Base):
    """A single duty segment within a session (e.g. 6:30 AM–10:15 AM Driving)."""
    __tablename__ = 'duty_logs'

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey('duty_sessions.id'), nullable=False)
    contractor_id: Mapped[int] = mapped_column(ForeignKey('contractor.id'), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # driving, on_duty, off_duty, sleeper_berth
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)  # null = currently active
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=True)  # computed when end_time is set
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc), nullable=False)

    session = relationship("DutySessions", back_populates="logs")


class AiInspectionReports(Base):
    """AI-generated inspection report saved by a contractor from the inspection assistant.

    Optionally tied back to a formal Inspections row via inspection_id — e.g. when
    the contractor generates an AI report while completing a scheduled inspection.
    Left nullable because reports can also be standalone (ad-hoc field notes).
    """
    __tablename__ = 'ai_inspection_reports'

    id: Mapped[int] = mapped_column(primary_key=True)
    contractor_id: Mapped[int] = mapped_column(ForeignKey('contractor.id'), nullable=False, index=True)
    inspection_id: Mapped[int] = mapped_column(ForeignKey('inspections.id'), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    priority: Mapped[str] = mapped_column(String(20), nullable=False)   # low | medium | high
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(2000), nullable=False)
    recommended_actions: Mapped[str] = mapped_column(String(3000), nullable=False)  # JSON array stored as string
    raw_notes: Mapped[str] = mapped_column(String(2000), nullable=True)             # original field notes
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc), nullable=False)

    inspection = relationship("Inspections")




class Vendor(Base):
    __tablename__ = 'vendor'

    id: Mapped[int] = mapped_column(primary_key = True, nullable=False)
    company_name: Mapped[str] = mapped_column(String(360), nullable=False)
    company_code: Mapped[str] = mapped_column(String(360), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=True)
    primary_contact_name: Mapped[str] = mapped_column(String(360), nullable=False)
    company_email: Mapped[str] = mapped_column(String(360), nullable=False)
    company_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)

    vendor_code: Mapped[str] = mapped_column(String(360), nullable=False, unique=True)
    onboarding: Mapped[str] = mapped_column(String(360), nullable=True)
    compliance_status: Mapped[str] = mapped_column(String(360), nullable=True)
    description: Mapped[str] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc),   nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey('authuser.id'), nullable=False)
    updated_by: Mapped[int] = mapped_column(ForeignKey('authuser.id'), nullable=True)    
    address_id: Mapped[int] = mapped_column(ForeignKey('address.id'), nullable=False)


    #authuser = relationship("User", back_populates="vendor", foreign_keys=[id])

class Client(Base):
    __tablename__ = 'client'

    id: Mapped[int] = mapped_column(primary_key = True, nullable=False)
    client_name: Mapped[str] = mapped_column(String(360), nullable=False)
    client_code: Mapped[str] = mapped_column(String(360), nullable=False)
    primary_contact_name: Mapped[str] = mapped_column(String(360), nullable=False)
    company_email: Mapped[str] = mapped_column(String(360), nullable=False)
    company_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    company_web_address: Mapped[str] = mapped_column(String(360), nullable=True)
    approved_domain: Mapped[str] = mapped_column(String(360), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc),   nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey('authuser.id'), nullable=False)
    updated_by: Mapped[int] = mapped_column(ForeignKey('authuser.id'), nullable=True)    
    address_id: Mapped[int] = mapped_column(ForeignKey('address.id'), nullable=False)

    #authuser = relationship("User", back_populates="client", foreign_keys=[id])


class Address(Base):
    __tablename__ = 'address'

    id: Mapped[int] = mapped_column(primary_key = True, nullable=False)
    street: Mapped[str] = mapped_column(String(360), nullable=True)
    city: Mapped[str] = mapped_column(String(360), nullable=True)
    state: Mapped[str] = mapped_column(String(360), nullable=True)
    zip_code: Mapped[str] = mapped_column(String(20), nullable=True)
    country: Mapped[str] = mapped_column(String(360), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc),   nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey('authuser.id'), nullable=False)
    updated_by: Mapped[int] = mapped_column(ForeignKey('authuser.id'), nullable=True)    
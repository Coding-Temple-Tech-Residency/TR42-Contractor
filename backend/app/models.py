from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import Date, String, Integer, Float, ForeignKey, Table, Column, Boolean, DateTime
from datetime import date, datetime, timezone

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

class Auth_users(Base):
    __tablename__ = 'auth_users'

    id: Mapped[int] = mapped_column(primary_key = True)
    email: Mapped[str] = mapped_column(String(360), nullable=False, unique=True)
    username: Mapped[str] = mapped_column(String(360), nullable=False, unique=True)
    password: Mapped[str] = mapped_column(String(500), nullable=False)
    role: Mapped[str] = mapped_column(String(360), nullable=False)  # vendor, client, contractor
    # biometric_data: Mapped[str] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    profile_photo: Mapped[str] = mapped_column(String(500), nullable=True) #update to linked photo table later
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc),   nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey('auth_users.id'), nullable=False)
    updated_by: Mapped[int] = mapped_column(ForeignKey('auth_users.id'), nullable=True)

    contractor = relationship("Contractors", uselist=False, back_populates="auth_user", foreign_keys="Contractors.id")
    vendor = relationship("Vendors", uselist=False, back_populates="auth_user", foreign_keys="Vendors.id")
    client = relationship("Clients", uselist=False, back_populates="auth_user", foreign_keys="Clients.id")

class Contractors(Base):
    __tablename__ = 'contractors'

    id: Mapped[int] = mapped_column(ForeignKey('auth_users.id'), primary_key = True, nullable=False)
    vendor_id: Mapped[int] = mapped_column(ForeignKey('vendors.id'), nullable=False)
    manager_id: Mapped[int] = mapped_column(ForeignKey('auth_users.id'), nullable=False)
    first_name: Mapped[str] = mapped_column(String(360), nullable=False)
    last_name: Mapped[str] = mapped_column(String(360), nullable=False)
    
    license_number: Mapped[str] = mapped_column(String(20), nullable=False)
    expiration_date: Mapped[date] = mapped_column(Date, nullable=False)
    contractor_type: Mapped[str] = mapped_column(String(360), nullable=False)  #clarify if contractor_type is necessary for contractors
    status: Mapped[str] = mapped_column(String(20), nullable=False)  #clarify if active status is needed (ex. offboarded)
    tax_classification: Mapped[str] = mapped_column(String(360), nullable=False)
    # approved_status: Mapped[str] = mapped_column(String(100), nullable=False) clarify if approval status is needed for contractors (ex. pending, approved, rejected)
    contact_number: Mapped[str] = mapped_column(String(20), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    offline_pin: Mapped[str] = mapped_column(String(10), nullable=True)

    auth_user = relationship("Auth_users", back_populates="contractor", foreign_keys=[id])
    

class Work_orders(Base):
    __tablename__ = 'work_orders'

    id: Mapped[int] = mapped_column(primary_key = True)
    assigned_vendor: Mapped[int] = mapped_column(ForeignKey('vendors.id'), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    current_status: Mapped[str] = mapped_column(String(360), nullable=False)
    location: Mapped[str] = mapped_column(String(500), nullable=False) #long and lat should be stored as string and parsed by frontend for mapping, clarify if this should be a separate table for multiple locations per work order
    estimated_cost: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_duration: Mapped[float] = mapped_column(Float, nullable=False)
    priority: Mapped[str] = mapped_column(String(360), nullable=False)



class Tickets(Base):
    __tablename__ = 'tickets'

    id: Mapped[int] = mapped_column(primary_key = True)
    work_order_id: Mapped[int] = mapped_column(ForeignKey('work_orders.id'), index=True, nullable=False)
    vendor_id: Mapped[int] = mapped_column(ForeignKey('vendors.id'), index=True, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    priority: Mapped[str] = mapped_column(String(360), nullable=False)
    status: Mapped[str] = mapped_column(String(360), nullable=False) #ex. to_do, in_progress, completed

    assigned_contractor: Mapped[int] = mapped_column(ForeignKey('contractors.id'))
    contractor_assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    task_created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    start_location: Mapped[str] = mapped_column(String(500), nullable=True)
    end_location: Mapped[str] = mapped_column(String(500), nullable=True)
    designated_route: Mapped[str] = mapped_column(String(500), nullable=True)
    
    estimated_quantity: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(360))
    special_requirements: Mapped[str] = mapped_column(String(500))
    
    contractor_notes: Mapped[str] = mapped_column(String(500))
    anomaly_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    anomaly_reason: Mapped[str] = mapped_column(String(500), nullable=True)


#vendors and clients to be updated

# ── Inspection models ─────────────────────────────────────────────────────────
# Checklist sections and items are stored in the DB so vendors/admins can
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
    contractor_id: Mapped[int] = mapped_column(ForeignKey('contractors.id'), nullable=False)
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


class Vendors(Base):
    __tablename__ = 'vendors'

    id: Mapped[int] = mapped_column(ForeignKey('auth_users.id'), primary_key = True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(360), nullable=False)
    last_name: Mapped[str] = mapped_column(String(360), nullable=False)

    auth_user = relationship("Auth_users", back_populates="vendor", foreign_keys=[id])

class Clients(Base):
    __tablename__ = 'clients'

    id: Mapped[int] = mapped_column(ForeignKey('auth_users.id'), primary_key = True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(360), nullable=False)
    last_name: Mapped[str] = mapped_column(String(360), nullable=False)

    auth_user = relationship("Auth_users", back_populates="client", foreign_keys=[id])

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
    location: Mapped[str] = mapped_column(String(500), nullable=False)
    # estimated_cost: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_duration: Mapped[float] = mapped_column(Float, nullable=False)
    priority: Mapped[str] = mapped_column(String(360), nullable=False)



class Tickets(Base):
    __tablename__ = 'tickets'

    id: Mapped[int] = mapped_column(primary_key = True)
    work_order_id: Mapped[int] = mapped_column(ForeignKey('work_orders.id'), index=True, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    priority: Mapped[str] = mapped_column(String(360), nullable=False)
    task_status: Mapped[str] = mapped_column(String(360), nullable=False)

    assigned_contractor: Mapped[int] = mapped_column(ForeignKey('contractors.id'))
    contractor_assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    task_created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    start_location: Mapped[str] = mapped_column(String(500))
    end_location: Mapped[str] = mapped_column(String(500))

    estimated_quantity: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(360))
    special_requirements: Mapped[str] = mapped_column(String(500))
    
    contractor_notes: Mapped[str] = mapped_column(String(500))
    anomaly_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    anomaly_reason: Mapped[str] = mapped_column(String(500))


#vendors and clients to be updated

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

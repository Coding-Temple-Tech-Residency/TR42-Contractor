from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import Date, String, Integer, Float, ForeignKey, Table, Column, Boolean, DateTime
from datetime import date, datetime

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

class Auth_users(Base):
    __tablename__ = 'auth_users'

    id: Mapped[int] = mapped_column(primary_key = True)
    email: Mapped[str] = mapped_column(String(360), nullable=False, unique=True)
    username: Mapped[str] = mapped_column(String(360), nullable=False, unique=True)
    password: Mapped[str] = mapped_column(String(500), nullable=False)
    # created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Contractors(Base):
    __tablename__ = 'contractors'

    id: Mapped[int] = mapped_column(ForeignKey('auth_users.id'), primary_key = True, nullable=False)
    vendor_id: Mapped[int] = mapped_column(ForeignKey('vendors.id'), nullable=False)
    manager_id: Mapped[int] = mapped_column(ForeignKey('auth_users.id'), nullable=False)
    first_name: Mapped[str] = mapped_column(String(360), nullable=False)
    last_name: Mapped[str] = mapped_column(String(360), nullable=False)
    contact_number: Mapped[str] = mapped_column(String(20), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    offline_pin: Mapped[str] = mapped_column(String(10), nullable=True)
    #back up measure to reset pin.  (security questions or phone pin/phone biometrics) 
    # send email to manager notifying new pin reset

    # role: Mapped[str] = mapped_column(String(360), nullable=False) manager, worker, admin


class Work_orders(Base):
    __tablename__ = 'work_orders'

    id: Mapped[int] = mapped_column(primary_key = True)
    assigned_vendor: Mapped[int] = mapped_column(ForeignKey('vendors.id'), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    current_status: Mapped[str] = mapped_column(String(360), nullable=False)
    location: Mapped[str] = mapped_column(String(500), nullable=False)
    estimated_cost: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_duration: Mapped[float] = mapped_column(Float, nullable=False)
    priority: Mapped[str] = mapped_column(String(360), nullable=False)
    # assigned_contractor: Mapped[int] = mapped_column(ForeignKey('contractors.id'), nullable=True) list of contractor that accepted.


class Tasks(Base):
    __tablename__ = 'tasks'

    id: Mapped[int] = mapped_column(primary_key = True)
    work_order_id: Mapped[int] = mapped_column(ForeignKey('work_orders.id'), nullable=False)
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

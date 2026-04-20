"""
seed_dev.py — Full dev reset + re-seed in one command.

Wipes all app data (keeps the schema), then inserts:
  • 1 vendor user  (manager / admin)
  • 1 contractor   (aldo / the logged-in demo user)
  • Truck Pre-Trip Inspection template (6 sections, 30 items)
  • Today's drive-time session with realistic log segments
  • 3 sample tickets

Usage (from the backend/ directory, with Flask running or not):
    python seed_dev.py

Login creds after seeding:
    username : aldo        password : 123456
    username : vendor      password : 123456
"""

from dotenv import load_dotenv
load_dotenv()

from datetime import date, datetime, timedelta, timezone
from werkzeug.security import generate_password_hash
from app import create_app
from app.models import (
    db,
    Auth_users, Contractors, Vendors,
    InspectionTemplates, InspectionSections, InspectionItems, Inspections, InspectionResults,
    DutySessions, DutyLogs,
    Tickets, Work_orders,
    AiInspectionReports,
)

import os
config = 'ProductionConfig' if os.environ.get('DATABASE_URL') else 'DevelopmentConfig'
app = create_app(config)

# ── Inspection checklist ──────────────────────────────────────────────────────

INSPECTION_SECTIONS = [
    ('Engine Compartment', 1, [
        'Check oil level',
        'Check coolant level',
        'Inspect belts (no cracks/fraying)',
        'Check hoses for leaks',
        'Power steering fluid',
        'Windshield washer fluid',
    ]),
    ('Lights Check', 2, [
        'Headlights (high and low beam)',
        'Tail lights',
        'Brake lights',
        'Turn signals (front and rear)',
        'Hazard lights',
        'Clearance/marker lights',
    ]),
    ('Front of Vehicle', 3, [
        'Windshield condition (no cracks)',
        'Wiper blades condition',
        'Front bumper secure',
        'License plate visible and secure',
        'Mirrors clean and adjusted',
    ]),
    ('Driver Side', 4, [
        'Door opens/closes properly',
        'Window operates correctly',
        'Mirror secure and clean',
        'Fuel cap secure',
        'Steps/handrails secure',
    ]),
    ('Wheels & Tires', 5, [
        'Tire pressure adequate',
        'Tread depth sufficient',
        'No cuts, bulges, or damage',
        'Lug nuts tight',
        'Valve stems intact',
        'Spare tire present and inflated',
    ]),
    ('Brake System Check', 6, [
        'Brake pedal firm',
        'Parking brake holds',
        'Air brake pressure builds properly',
        'No air leaks detected',
        'Brake lines/hoses intact',
    ]),
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def now_utc():
    return datetime.now(timezone.utc)

def hours_ago(h):
    return now_utc() - timedelta(hours=h)

def mins_ago(m):
    return now_utc() - timedelta(minutes=m)


# ── Wipe ──────────────────────────────────────────────────────────────────────

def wipe(session):
    """Truncate all app tables, resetting sequences so IDs start at 1."""
    print('Wiping existing data...')
    session.execute(db.text(
        'TRUNCATE TABLE auth_users RESTART IDENTITY CASCADE'
    ))
    session.commit()
    print('  [OK] All rows cleared')


# ── Users ─────────────────────────────────────────────────────────────────────

def seed_users(session):
    print('Seeding users...')
    pw = generate_password_hash('123456')

    # Defer FK checks so self-referential created_by resolves at commit time
    try:
        session.execute(db.text(
            'ALTER TABLE auth_users ALTER CONSTRAINT auth_users_created_by_fkey '
            'DEFERRABLE INITIALLY DEFERRED'
        ))
        session.commit()
    except Exception:
        session.rollback()

    # Vendor / manager user (self-referential created_by handled below)
    vendor_auth = Auth_users(
        email='vendor@tr42.com',
        username='vendor',
        password=pw,
        role='vendor',
        is_active=True,
        created_by=1,   # will patch after flush
    )
    session.add(vendor_auth)
    session.flush()
    vendor_auth.created_by = vendor_auth.id   # self-reference

    vendor = Vendors(
        id=vendor_auth.id,
        first_name='Jonathan',
        last_name='Manager',
    )
    session.add(vendor)
    session.flush()

    # Contractor user
    contractor_auth = Auth_users(
        email='aldo@tr42.com',
        username='aldo',
        password=pw,
        role='contractor',
        is_active=True,
        created_by=vendor_auth.id,
    )
    session.add(contractor_auth)
    session.flush()

    contractor = Contractors(
        id=contractor_auth.id,
        vendor_id=vendor.id,
        manager_id=vendor_auth.id,
        first_name='Aldo',
        last_name='Cruz',
        license_number='CDL-TX-998877',
        expiration_date=date(2027, 6, 30),
        contractor_type='CDL-A',
        status='active',
        tax_classification='1099',
        contact_number='555-867-5309',
        date_of_birth=date(1990, 4, 16),
        address='1234 Maple St, Houston TX 77001',
    )
    session.add(contractor)
    session.commit()

    print(f'  [OK] vendor  -- username: vendor   id: {vendor_auth.id}')
    print(f'  [OK] contractor -- username: aldo  id: {contractor_auth.id}')
    return vendor_auth, vendor, contractor_auth, contractor


# ── Inspection template ───────────────────────────────────────────────────────

def seed_inspection_template(session):
    print('Seeding inspection template...')
    template = InspectionTemplates(
        name='Truck Pre-Trip Inspection',
        description='Standard pre-trip vehicle inspection checklist',
    )
    session.add(template)
    session.flush()

    for section_name, order, items in INSPECTION_SECTIONS:
        section = InspectionSections(
            template_id=template.id,
            name=section_name,
            display_order=order,
        )
        session.add(section)
        session.flush()
        for i, label in enumerate(items, 1):
            session.add(InspectionItems(
                section_id=section.id,
                label=label,
                display_order=i,
            ))

    session.commit()
    total_items = sum(len(items) for _, _, items in INSPECTION_SECTIONS)
    print(f'  [OK] template "{template.name}" — {len(INSPECTION_SECTIONS)} sections, {total_items} items')
    return template


# ── Drive time session ────────────────────────────────────────────────────────

def seed_drive_time(session, contractor_id):
    """Seed a realistic in-progress session for today."""
    print('Seeding drive time session...')

    session_obj = DutySessions(
        contractor_id=contractor_id,
        current_status='driving',
        session_date=date.today(),
        started_at=hours_ago(6),
        is_active=True,
    )
    session.add(session_obj)
    session.flush()

    # Historical log segments
    segments = [
        # status,       start,          end,            duration_s
        ('on_duty',   hours_ago(6),   hours_ago(5.5), int(0.5 * 3600)),
        ('driving',   hours_ago(5.5), hours_ago(3),   int(2.5 * 3600)),
        ('on_duty',   hours_ago(3),   hours_ago(2.75),int(0.25* 3600)),
        ('driving',   hours_ago(2.75),hours_ago(1),   int(1.75* 3600)),
        ('off_duty',  hours_ago(1),   mins_ago(30),   int(0.5 * 3600)),
        # currently active — no end_time
        ('driving',   mins_ago(30),   None,           None),
    ]

    for status, start, end, dur in segments:
        session.add(DutyLogs(
            session_id=session_obj.id,
            contractor_id=contractor_id,
            status=status,
            start_time=start,
            end_time=end,
            duration_seconds=dur,
        ))

    session.commit()
    # driving total: 2.5 + 1.75 = 4.25 hrs of closed segments + 30 min active
    print(f'  [OK] session id {session_obj.id} — status: driving, ~4h 45m drive time today')
    return session_obj


# ── Sample tickets ────────────────────────────────────────────────────────────

def seed_tickets(session, vendor_id, contractor_id):
    print('Seeding work order + tickets...')

    wo = Work_orders(
        assigned_vendor=vendor_id,
        created_at=now_utc() - timedelta(days=2),
        description='Routine tanker delivery route — Houston distribution circuit',
        due_date=date.today() + timedelta(days=3),
        current_status='in_progress',
        location='29.7604,-95.3698',
        estimated_cost=2400.00,
        estimated_duration=8.0,
        priority='high',
    )
    session.add(wo)
    session.flush()

    tickets_data = [
        ('Deliver 5000 gal diesel to Depot A',  'high',   'in_progress'),
        ('Deliver 3000 gal unleaded to Depot B', 'medium', 'to_do'),
        ('Return empty tanker to yard',          'low',    'to_do'),
    ]

    for desc, priority, status in tickets_data:
        session.add(Tickets(
            work_order_id=wo.id,
            vendor_id=vendor_id,
            description=desc,
            priority=priority,
            status=status,
            assigned_contractor=contractor_id,
            contractor_assigned_at=now_utc() - timedelta(hours=5),
            task_created_at=now_utc() - timedelta(days=2),
            estimated_quantity=5000.0,
            unit='gallons',
            special_requirements='No smoking within 50 ft of vehicle',
            contractor_notes='',
            anomaly_flag=False,
        ))

    session.commit()
    print(f'  [OK] work order id {wo.id} — {len(tickets_data)} tickets assigned to contractor')


# ── Main ──────────────────────────────────────────────────────────────────────

def seed():
    with app.app_context():
        wipe(db.session)
        vendor_auth, vendor, contractor_auth, contractor = seed_users(db.session)
        seed_inspection_template(db.session)
        seed_drive_time(db.session, contractor.id)
        # seed_tickets(db.session, vendor.id, contractor.id)  # TODO: Fix Tickets schema mismatch on ai-assistant branch

        print()
        print('=' * 50)
        print('Dev seed complete!')
        print('  Login -- username: aldo   password: 123456')
        print('=' * 50)


if __name__ == '__main__':
    seed()

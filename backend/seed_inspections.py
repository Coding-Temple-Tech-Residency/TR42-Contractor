"""
Seed script for the Truck Pre-Trip Inspection template.
Run once to populate the inspection_templates, inspection_sections, and
inspection_items tables with the standard checklist from the Figma design.

Usage:
    python seed_inspections.py
"""
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.models import db, InspectionTemplates, InspectionSections, InspectionItems

app = create_app('DevelopmentConfig')

SECTIONS = [
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


def seed():
    with app.app_context():
        existing = db.session.query(InspectionTemplates).filter_by(
            name='Truck Pre-Trip Inspection'
        ).first()

        if existing:
            print('Template already exists — skipping.')
            return

        template = InspectionTemplates(
            name='Truck Pre-Trip Inspection',
            description='Standard pre-trip vehicle inspection checklist',
        )
        db.session.add(template)
        db.session.flush()

        for section_name, order, items in SECTIONS:
            section = InspectionSections(
                template_id=template.id,
                name=section_name,
                display_order=order,
            )
            db.session.add(section)
            db.session.flush()

            for i, label in enumerate(items, 1):
                item = InspectionItems(
                    section_id=section.id,
                    label=label,
                    display_order=i,
                )
                db.session.add(item)

        db.session.commit()
        print(f'Seeded template "{template.name}" (ID {template.id})')
        for s in template.sections:
            print(f'  {s.name}: {len(s.items)} items')


if __name__ == '__main__':
    seed()

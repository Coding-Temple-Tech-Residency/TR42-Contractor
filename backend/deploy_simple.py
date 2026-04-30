#!/usr/bin/env python3
"""Deploy to Neon - simple version"""

import subprocess
import sys
import os

# Install psycopg2 if needed
try:
    import psycopg2
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "psycopg2-binary"])
    import psycopg2

EMAIL = "james.bustamante44@gmail.com"
PASSWORD = "Zaglba900$$"

print("=" * 60)
print("Neon Database Deployment")
print("=" * 60)

# Read schema
schema_path = os.path.join(os.path.dirname(__file__), 'database_schema.sql')
with open(schema_path, 'r') as f:
    schema_sql = f.read()

# Get connection info from user
print("\nProject: old-hat-13256283")
print("Email:", EMAIL)
host = input("\nEnter Neon host (from console, e.g., xxxx.us-east-2.aws.neon.tech): ").strip()
dbname = input("Enter database name (default: neondb): ").strip() or "neondb"

if not host:
    print("Host required. Get it from https://console.neon.tech/app/projects/old-hat-13256283")
    sys.exit(1)

print(f"\nConnecting to {host}...")

try:
    conn = psycopg2.connect(
        host=host,
        database=dbname,
        user=EMAIL,
        password=PASSWORD,
        sslmode='require',
        connect_timeout=10
    )
    print("Connected!")
    
    cursor = conn.cursor()
    
    # Execute schema
    print("\nCreating tables...")
    cursor.execute(schema_sql)
    conn.commit()
    
    # Verify
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    tables = [r[0] for r in cursor.fetchall()]
    print(f"\n✓ Created {len(tables)} tables: {', '.join(tables)}")
    
    cursor.close()
    conn.close()
    print("\n✅ Deployment complete!")
    
except Exception as e:
    print(f"\n✗ Error: {e}")
    print("\nTroubleshooting:")
    print("1. Check host is correct from Neon console")
    print("2. Ensure password is correct")
    print("3. Check database name exists")

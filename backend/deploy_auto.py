#!/usr/bin/env python3
"""Auto-deploy to Neon with common host patterns"""

import subprocess
import sys
import os
import time

# Install psycopg2 if needed
try:
    import psycopg2
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "psycopg2-binary"])
    import psycopg2

EMAIL = "james.bustamante44@gmail.com"
PASSWORD = "Zaglba900$$"
PROJECT_ID = "old-hat-13256283"

# Common Neon host patterns to try
HOST_PATTERNS = [
    f"{PROJECT_ID}.us-east-2.aws.neon.tech",
    f"{PROJECT_ID}.us-east-1.aws.neon.tech", 
    f"{PROJECT_ID}.eu-west-1.aws.neon.tech",
    f"{PROJECT_ID}.ap-southeast-1.aws.neon.tech",
    "pg.neon.tech",
    f"{PROJECT_ID}.neon.tech"
]

print("=" * 60)
print("Neon Auto-Deployment")
print("=" * 60)

# Read schema
schema_path = os.path.join(os.path.dirname(__file__), 'database_schema.sql')
with open(schema_path, 'r') as f:
    schema_sql = f.read()

# Try each host
conn = None
for host in HOST_PATTERNS:
    print(f"\nTrying {host}...")
    try:
        conn = psycopg2.connect(
            host=host,
            database="neondb",
            user=EMAIL,
            password=PASSWORD,
            sslmode='require',
            connect_timeout=5
        )
        print(f"✓ Connected to {host}!")
        break
    except Exception as e:
        print(f"  X {str(e)[:60]}")
        continue

if not conn:
    print("\n" + "=" * 60)
    print("COULD NOT AUTO-CONNECT")
    print("=" * 60)
    print("\nPlease go to:")
    print("https://console.neon.tech/app/projects/old-hat-13256283")
    print("\nClick 'Connect' → 'PostgreSQL' and copy the host.")
    print("\nThen run: python deploy_simple.py")
    sys.exit(1)

try:
    cursor = conn.cursor()
    
    # Check existing tables
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    existing = [r[0] for r in cursor.fetchall()]
    print(f"\nFound {len(existing)} existing tables")
    
    # Deploy schema
    print("\nDeploying schema (this may take a moment)...")
    cursor.execute(schema_sql)
    conn.commit()
    
    # Verify
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
    tables = [r[0] for r in cursor.fetchall()]
    
    print("\n" + "=" * 60)
    print("✅ SUCCESS! Database deployed to Neon")
    print("=" * 60)
    print(f"\nTotal tables: {len(tables)}")
    for t in tables:
        print(f"  - {t}")
    
    cursor.close()
    conn.close()
    print("\nYou can now set DATABASE_URL in your .env file:")
    print(f"DATABASE_URL=postgres://{EMAIL}:{PASSWORD}@{host}/neondb?sslmode=require")
    
except Exception as e:
    conn.rollback()
    print(f"\n✗ Error during deployment: {e}")
    print("\nThe schema may have partially deployed.")
    print("Check Neon console to see which tables were created.")

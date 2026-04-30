#!/usr/bin/env python3
"""Final deployment script - Neon"""

import sys
import os

# Ensure psycopg2
try:
    import psycopg2
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "psycopg2-binary"])
    import psycopg2

HOST = "old-hat-13256283.us-east-2.aws.neon.tech"
EMAIL = "james.bustamante44@gmail.com"
PASSWORD = "Zaglba900$$"
DBNAME = "neondb"

print("=" * 60)
print("Deploying to Neon")
print("=" * 60)
print(f"Host: {HOST}")
print(f"User: {EMAIL}")
print(f"Database: {DBNAME}")

# Read schema
schema_path = os.path.join(os.path.dirname(__file__), 'database_schema.sql')
with open(schema_path, 'r') as f:
    schema_sql = f.read()

print("\nConnecting...")
try:
    conn = psycopg2.connect(
        host=HOST,
        database=DBNAME,
        user=EMAIL,
        password=PASSWORD,
        sslmode='require',
        connect_timeout=15
    )
    print("Connected!")
    
    cursor = conn.cursor()
    
    # Check current tables
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    before = [r[0] for r in cursor.fetchall()]
    print(f"Tables before: {len(before)}")
    
    # Execute schema
    print("\nExecuting schema...")
    cursor.execute(schema_sql)
    conn.commit()
    
    # Check after
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
    after = [r[0] for r in cursor.fetchall()]
    
    print("\n" + "=" * 60)
    print("SUCCESS!")
    print("=" * 60)
    print(f"\nTotal tables: {len(after)}")
    for t in after:
        print(f"  - {t}")
    
    print(f"\nNew tables created: {len(after) - len(before)}")
    
    # Show connection string
    print("\n" + "=" * 60)
    print("Add this to your .env file:")
    print("=" * 60)
    print(f"DATABASE_URL=postgres://{EMAIL}:{PASSWORD}@{HOST}/{DBNAME}?sslmode=require")
    print("=" * 60)
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"\nERROR: {e}")
    print("\nPossible causes:")
    print("- Password incorrect")
    print("- Database 'neondb' doesn't exist")
    print("- Need to enable password auth in Neon console")
    sys.exit(1)

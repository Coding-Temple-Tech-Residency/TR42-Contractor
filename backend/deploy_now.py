#!/usr/bin/env python3
"""
Deploy to Neon with provided credentials.
"""

import subprocess
import sys
import os
import time

# Try to install psycopg2 if not available
try:
    import psycopg2
except ImportError:
    print("Installing psycopg2...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "psycopg2-binary"])
    import psycopg2

NEON_EMAIL = "james.bustamante44@gmail.com"
NEON_PASSWORD = "Zaglba900$$"

def get_neon_connection():
    """
    Neon connection details for project: old-hat-13256283
    Typical Neon host format: [project-id]-[branch].us-east-2.aws.neon.tech
    """
    
    # Common Neon host patterns for this project
    possible_hosts = [
        "old-hat-13256283.us-east-2.aws.neon.tech",
        "old-hat-13256283.neon.tech", 
        "pg.neon.tech"
    ]
    
    # Default Neon connection uses the project name as dbname
    dbname = "neondb"  # or "old-hat-13256283"
    
    for host in possible_hosts:
        try:
            conn_str = f"host={host} dbname={dbname} user={NEON_EMAIL} password={NEON_PASSWORD} sslmode=require"
            print(f"Trying {host}...")
            conn = psycopg2.connect(conn_str, connect_timeout=5)
            print(f"✓ Connected to {host}")
            return conn
        except Exception as e:
            print(f"  ✗ Failed: {e}")
            continue
    
    return None

def deploy():
    print("=" * 60)
    print("Neon Database Deployment")
    print("=" * 60)
    
    # Read schema
    schema_path = os.path.join(os.path.dirname(__file__), 'database_schema.sql')
    with open(schema_path, 'r') as f:
        schema = f.read()
    
    # Connect
    conn = get_neon_connection()
    if not conn:
        print("\n❌ Could not connect to Neon.")
        print("\nPlease go to:")
        print("https://console.neon.tech/app/projects/old-hat-13256283")
        print("\nClick 'Connect' and provide the exact host/database name.")
        return False
    
    cursor = conn.cursor()
    
    try:
        # Check existing tables
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        existing = [row[0] for row in cursor.fetchall()]
        print(f"\nFound {len(existing)} existing tables: {existing}")
        
        # Execute schema
        print("\nDeploying schema...")
        cursor.execute(schema)
        conn.commit()
        
        # Verify
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' ORDER BY table_name
        """)
        new_tables = [row[0] for row in cursor.fetchall()]
        print(f"\n✅ Success! Now have {len(new_tables)} tables:")
        for t in new_tables:
            print(f"   - {t}")
            
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    deploy()
    input("\nPress Enter to exit...")

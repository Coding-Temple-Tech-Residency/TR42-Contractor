#!/usr/bin/env python3
"""
Deploy database schema to Neon PostgreSQL.
Run: python deploy_to_neon.py "your-neon-connection-string"
"""

import sys
import os

# Check if psycopg2 is available
try:
    import psycopg2
except ImportError:
    print("Installing psycopg2-binary...")
    os.system("pip install psycopg2-binary")
    import psycopg2

def deploy_schema(connection_string):
    """Read and execute database_schema.sql against Neon."""
    
    # Read the schema file
    schema_path = os.path.join(os.path.dirname(__file__), 'database_schema.sql')
    with open(schema_path, 'r') as f:
        schema_sql = f.read()
    
    print("Connecting to Neon database...")
    conn = psycopg2.connect(connection_string)
    conn.autocommit = False
    cursor = conn.cursor()
    
    try:
        # Split SQL into statements and execute
        print("Creating tables...")
        
        # Execute in order - split by semicolons but be careful with function bodies
        statements = []
        current = ""
        for line in schema_sql.split('\n'):
            line = line.strip()
            if not line or line.startswith('--'):
                continue
            current += " " + line
            if line.endswith(';'):
                statements.append(current.strip())
                current = ""
        
        # Execute each statement
        for i, stmt in enumerate(statements):
            if not stmt:
                continue
            try:
                cursor.execute(stmt)
                print(f"  ✓ Executed statement {i+1}")
            except Exception as e:
                # Check if it's a "already exists" error
                error_msg = str(e).lower()
                if 'already exists' in error_msg or 'duplicate' in error_msg:
                    print(f"  ⚠ Skipped (already exists): {e}")
                else:
                    raise
        
        conn.commit()
        print("\n✅ Database schema deployed successfully!")
        
        # Verify tables were created
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        print(f"\n📊 Created {len(tables)} tables:")
        for table in tables:
            print(f"   - {table[0]}")
            
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python deploy_to_neon.py 'postgres://user:pass@host.neon.tech/dbname?sslmode=require'")
        print("\nGet your connection string from:")
        print("https://console.neon.tech/app/projects/old-hat-13256283")
        print("\nClick 'Connect' → 'PostgreSQL' → copy the connection string")
        sys.exit(1)
    
    connection_string = sys.argv[1]
    deploy_schema(connection_string)

# Deploy to Neon - RIGHT NOW

## Your Credentials
- **Email:** james.bustamante44@gmail.com
- **Password:** Zaglba900$$
- **Project:** old-hat-13256283

## Step 1: Get Your Host (Takes 30 seconds)

1. Go to: https://console.neon.tech/app/projects/old-hat-13256283
2. Click **"Connect"** button (top right)
3. Select **"PostgreSQL"**
4. Copy the **host** part from the connection string
   - It looks like: `old-hat-13256283-xxx.us-east-2.aws.neon.tech`

## Step 2: Copy-Paste This Command

Open PowerShell and run:

```powershell
cd "C:\Users\James Bustamante\CascadeProjects\TR42-Contractor\backend"
$env:PGPASSWORD="Zaglba900$$"
psql -h HOST_FROM_STEP_1 -U james.bustamante44@gmail.com -d neondb -f database_schema.sql
```

**Replace `HOST_FROM_STEP_1` with your actual host.**

## Alternative: Use Python (if psql not installed)

```powershell
cd "C:\Users\James Bustamante\CascadeProjects\TR42-Contractor\backend"
python -c "
import psycopg2
conn = psycopg2.connect(
    host='HOST_FROM_STEP_1',
    database='neondb',
    user='james.bustamante44@gmail.com',
    password='Zaglba900$$',
    sslmode='require'
)
cursor = conn.cursor()
with open('database_schema.sql', 'r') as f:
    cursor.execute(f.read())
conn.commit()
print('✅ Deployed!')
"
```

## Step 3: Create Your .env File

Create file `backend/.env`:

```
DATABASE_URL=postgres://james.bustamante44@gmail.com:Zaglba900$$@HOST_FROM_STEP_1/neondb?sslmode=require
SECRET_KEY=change-this-to-a-random-key
ANTHROPIC_API_KEY=your-key-here
```

## Done!

Your database is now on Neon with all tables created.

# Neon Database Deployment Guide

## Summary of Fix

Fixed the `recommended_actions` field serialization issue in the AI inspection reports.

### Problem
The schema expected a Python `list` but the database stored it as a JSON string. Routes had manual `json.dumps()`/`json.loads()` workarounds.

### Solution
Added `JSONListField` custom Marshmallow field that handles automatic serialization:
- Deserializes: Python list → JSON string (for database storage)
- Serializes: JSON string → Python list (for API response)

### Files Modified
- `app/blueprints/ai/schemas.py` - Added `JSONListField` class
- `app/blueprints/ai/routes.py` - Removed manual JSON conversion code

## Neon Deployment Steps

### 1. Get Neon Connection String
1. Go to https://console.neon.tech/app/projects/old-hat-13256283
2. Click "Connect" button
3. Copy the PostgreSQL connection string
4. It will look like: `postgres://username:password@host.region.aws.neon.tech/dbname?sslmode=require`

### 2. Set Environment Variables
Create `.env` file in `backend/` folder:

```bash
# Required: Neon Database URL
DATABASE_URL=postgres://username:password@your-neon-host.neon.tech/dbname?sslmode=require

# Required: Secret key for JWT signing
SECRET_KEY=your-generated-secret-key-here

# Required for AI feature
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

### 3. Create Database Schema
Option A: Use Neon SQL Editor
1. Open Neon Console → SQL Editor
2. Copy contents of `database_schema.sql`
3. Run the SQL

Option B: Use psql CLI
```bash
psql "postgres://username:password@your-neon-host.neon.tech/dbname?sslmode=require" -f database_schema.sql
```

### 4. Run Seed Data (Optional)
After schema is created:
```bash
cd backend
python seed_dev.py
python seed_inspections.py
```

### 5. Deploy Backend
Push code to repository and deploy to your hosting platform (Heroku, Railway, etc.)

## Verification

Test the AI report endpoints:

```bash
# 1. Get auth token first (login)
curl -X POST https://your-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# 2. Test AI inspection assist
curl -X POST https://your-api.com/api/ai/inspection-assist \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Engine oil level low, brake pads worn"}'

# 3. Save AI report
curl -X POST https://your-api.com/api/ai/save-report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Engine Maintenance Required",
    "priority":"high",
    "category":"Engine",
    "description":"Engine oil level is critically low",
    "recommended_actions":["Add engine oil","Check for leaks","Replace oil filter"]
  }'

# 4. Get saved reports
curl https://your-api.com/api/ai/reports \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Schema Reference

See `SCHEMA.md` for full database documentation.

Key tables:
- `authuser` - User accounts
- `contractor` - Contractor profiles
- `ai_inspection_reports` - AI-generated reports (fixed table)
- `inspections` / `inspection_results` - Manual inspection checklists
- `duty_sessions` / `duty_logs` - FMCSA hours of service tracking

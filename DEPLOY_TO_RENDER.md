# Deploy to Render

## Quick Deploy (5 minutes)

### 1. Push Code to GitHub
Already done - your code is ready at:
https://github.com/Coding-Temple-Tech-Residency/TR42-Contractor

### 2. Deploy on Render

**Option A: Blueprint (Automatic)**
1. Go to https://dashboard.render.com/blueprints
2. Click **"New Blueprint Instance"**
3. Connect your GitHub repo: `TR42-Contractor`
4. Render will detect `render.yaml` and configure automatically
5. Set these environment variables when prompted:
   - `DATABASE_URL` = `postgres://james.bustamante44@gmail.com:Zaglba900$$@old-hat-13256283.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - `ANTHROPIC_API_KEY` = your actual Anthropic API key
5. Click **"Apply"**

**Option B: Manual Web Service**
1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repo: `TR42-Contractor`
4. Settings:
   - **Name**: `tr42-contractor-api`
   - **Runtime**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && gunicorn flask_app:app`
5. Click **"Advanced"** and add environment variables:
   ```
   DATABASE_URL=postgres://james.bustamante44@gmail.com:Zaglba900$$@old-hat-13256283.us-east-2.aws.neon.tech/neondb?sslmode=require
   SECRET_KEY=generate-a-random-key-or-let-render-generate
   ANTHROPIC_API_KEY=your-anthropic-key
   FLASK_ENV=production
   RENDER=true
   ```
6. Click **"Create Web Service"**

### 3. Verify Deployment

Once deployed (takes 2-3 minutes), your API will be at:
```
https://tr42-contractor-api.onrender.com
```

Test endpoints:
```bash
# Health check
curl https://tr42-contractor-api.onrender.com/

# Login (after seeding data)
curl -X POST https://tr42-contractor-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Important Notes

### Database Already Created
✅ Your 15 tables are already on Neon - no need to run migrations

### Environment Variables on Render
Set these in Render Dashboard → Your Service → Environment:
- `DATABASE_URL` (your Neon connection string)
- `SECRET_KEY` (generate with `python -c "import secrets; print(secrets.token_hex(32))"`)
- `ANTHROPIC_API_KEY` (from https://console.anthropic.com)
- `RENDER=true` (enables production config)

### Code is Ready
- ✅ Fixed `schemas.py` with `JSONListField`
- ✅ Fixed `routes.py` removed manual JSON conversion
- ✅ `render.yaml` configured
- ✅ `requirements.txt` has all dependencies including `psycopg2-binary` and `gunicorn`

## Troubleshooting

### If build fails:
Check Render logs - usually missing dependency. Add to `requirements.txt` if needed.

### If database connection fails:
1. Check `DATABASE_URL` is correctly set in Render environment
2. Verify Neon allows connections from Render IPs (usually automatic)
3. Check Neon console that database is active

### If AI features don't work:
Set `ANTHROPIC_API_KEY` in Render environment variables.

---

**Ready to deploy?** Go to https://dashboard.render.com/ and follow Option A or B above.

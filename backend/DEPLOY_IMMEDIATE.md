# Deploy RIGHT NOW - 2 Options

## Option 1: Passwordless Auth (Easiest - 1 minute)

Neon sent an auth URL. Run this in PowerShell:

```powershell
cd "C:\Users\James Bustamante\CascadeProjects\TR42-Contractor\backend"
python -c "import psycopg2; conn=psycopg2.connect(host='old-hat-13256283.us-east-2.aws.neon.tech', database='neondb', user='james.bustamante44@gmail.com', sslmode='require'); print(conn)"
```

This will show a URL like:
```
https://console.neon.tech/psql_session/xxxxx
```

1. **Open that URL in your browser**
2. **Click "Allow"** 
3. **Come back here** - the deploy will continue

## Option 2: Set Password in Console (2 minutes)

1. Go to: https://console.neon.tech/app/projects/old-hat-13256283
2. Click your project
3. Go to **"Settings"** or **"Users"**
4. Set a **password** for `james.bustamante44@gmail.com`
5. Run this (I'll use the new password):

```powershell
cd "C:\Users\James Bustamante\CascadeProjects\TR42-Contractor\backend"
python deploy_final.py
```

## Option 3: Use SQL Editor (Manual - 5 minutes)

1. Go to: https://console.neon.tech/app/projects/old-hat-13256283
2. Click **"SQL Editor"**
3. Open `database_schema.sql` from this folder
4. Copy-paste into SQL Editor
5. Click **"Run"**

---

**Which option do you want to use?**

If you choose **Option 1**, run the command above and paste the auth URL here.
If you choose **Option 2**, set the password and tell me what you set it to.
If you choose **Option 3**, you're done after running the SQL.

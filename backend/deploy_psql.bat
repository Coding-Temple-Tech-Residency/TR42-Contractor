@echo off
REM Deploy schema to Neon using psql
REM Requires: psql installed and Neon passwordless auth configured

echo Deploying schema to Neon (pg.neon.tech)...
echo.

REM Check if psql is available
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: psql not found. Install PostgreSQL client first.
    echo Download from: https://www.postgresql.org/download/windows/
    exit /b 1
)

REM Get database name from user
set /p DBNAME="Enter your Neon database name: "
set /p USERNAME="Enter your Neon username: "

echo.
echo Connecting to pg.neon.tech database: %DBNAME% as %USERNAME%...
echo You may need to authenticate via browser for passwordless auth.
echo.

psql -h pg.neon.tech -U %USERNAME% -d %DBNAME% -f database_schema.sql

if %errorlevel% equ 0 (
    echo.
    echo ✅ Schema deployed successfully!
) else (
    echo.
    echo ❌ Deployment failed. Check error messages above.
)

pause

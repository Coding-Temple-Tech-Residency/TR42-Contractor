import os
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / '.env')  # always finds backend/.env regardless of cwd

from app import create_app
from app.models import db

# Render sets the RENDER env var automatically — use ProductionConfig there.
# Everything else (local dev) stays on DevelopmentConfig.
config = 'ProductionConfig' if os.environ.get('RENDER') else 'DevelopmentConfig'
app = create_app(config)

# Auto-init tables only against sqlite (throwaway local dev) or when explicitly
# requested via INIT_DB=1. Against shared Postgres (Supabase) the schema is
# managed externally — never let backend boot mutate it.
db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
if db_uri.startswith('sqlite') or os.environ.get('INIT_DB') == '1':
    with app.app_context():
        db.create_all()


if __name__ == '__main__':
    app.run(host='0.0.0.0')
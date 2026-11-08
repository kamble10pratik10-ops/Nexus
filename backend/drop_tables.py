"""
One-shot script to drop ALL NEXUS tables from Supabase.
Run this ONCE locally before redeploying to Render.

Usage:
    cd backend
    python drop_tables.py
"""
import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set. Check your .env file.")

print(f"Connecting to: {DATABASE_URL[:60]}...")
engine = create_engine(DATABASE_URL)

# Drop all tables in dependency order (children first, then parents)
DROP_ORDER = [
    "escalations",
    "responses",
    "findings",
    "ingestion_jobs",
    "cases",
    "alerts",
    "assets",
    "expected_evidence",
    "entities",
    "users",
]

with engine.connect() as conn:
    conn.execute(text("SET session_replication_role = replica;"))  # disable FK checks
    for table in DROP_ORDER:
        try:
            conn.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))
            print(f"  ✅ Dropped: {table}")
        except Exception as e:
            print(f"  ⚠️  Could not drop {table}: {e}")
    conn.execute(text("SET session_replication_role = DEFAULT;"))
    conn.commit()

print("\nAll tables dropped. Now push your code and redeploy on Render.")


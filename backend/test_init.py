import sys
import os
import traceback

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    print("1. Creating database tables...", flush=True)
    from app.database import Base, engine, SessionLocal
    from app.data_generator import generate_synthetic_data
    Base.metadata.create_all(bind=engine)
    print("2. Tables created successfully. Opening session...", flush=True)

    db = SessionLocal()
    generate_synthetic_data(db, entities_count=10, alerts_per_entity=40)
    print("3. SUCCESS: Data generated and Master Analytics completed!", flush=True)
    db.close()
except Exception as e:
    print("ERROR OCCURRED:", e, flush=True)
    traceback.print_exc()

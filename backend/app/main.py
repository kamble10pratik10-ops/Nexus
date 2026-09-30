from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import engine, Base, SessionLocal
import app.models
from app.models import Entity
from app.auth import seed_default_users
from app.data_generator import generate_synthetic_data
from app.analytics.engine import MasterSupervisoryAnalytics

# Routers
from app.routers.auth_router import router as auth_router
from app.routers.dashboard_router import router as dashboard_router
from app.routers.ingestion_router import router as ingestion_router
from app.routers.findings_router import router as findings_router
from app.routers.entities_router import router as entities_router
from app.routers.benchmarking_router import router as benchmarking_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed baseline demonstration data
    print("Initializing SAT-SA Database Schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        seed_default_users(db)
        if db.query(Entity).count() == 0:
            print("Database empty. Seeding Synthetic Demonstration Dataset (20 CSEs / SIH Evaluation)...")
            generate_synthetic_data(db)
            print("Running initial supervisory analytics...")
            MasterSupervisoryAnalytics.run_full_assessment(db)
    finally:
        db.close()
    
    yield
    print("SAT-SA Supervisory Engine Shutting Down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Supervisory Analytics Tool for SOC Assessment - NCIIPC & NTRO Evaluation Platform",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routers under API prefix
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX)
app.include_router(ingestion_router, prefix=settings.API_PREFIX)
app.include_router(findings_router, prefix=settings.API_PREFIX)
app.include_router(entities_router, prefix=settings.API_PREFIX)
app.include_router(benchmarking_router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "platform": "SAT-SA (Supervisory Analytics Tool for SOC Assessment)",
        "organization": "NTRO / NCIIPC",
        "theme": "Cybersecurity",
        "status": "OPERATIONAL",
        "mode": "AIR-GAPPED // SUPERVISORY ANALYTICS",
        "documentation": "/docs"
    }

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .database import engine, SessionLocal, Base
from .models.grid import SmartMeter, Feeder, Transformer, Substation
from .models.analytics import Anomaly, Forecast, Alert, RevenueReport
from .models.inspection import Inspection, InspectionEvidence
from .models.user import User
from .models.ai import AIExplanation

from .routers.auth import router as auth_router
from .routers.dashboard import router as dashboard_router
from .routers.grid import router as grid_router
from .routers.analytics import router as analytics_router
from .routers.inspections import router as inspections_router
from .routers.copilot import router as copilot_router
from .routers.websocket import router as websocket_router
from .routers.ml import router as ml_router
from .utils.seeder import seed_database
from .services.model_loader import model_loader

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("gridshield.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Seed DB
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    # Load ML models — safe, never crashes server
    logger.info("Loading ML models...")
    try:
        model_loader.load_all()
        health = model_loader.registry.health()
        loaded = sum(1 for v in health.values() if v.get("loaded"))
        logger.info(f"ML models ready: {loaded}/{len(health)} loaded")
    except Exception as e:
        logger.warning(f"Model loading encountered errors (non-fatal): {e}")
    yield
    logger.info("GridShield AI shutting down")


app = FastAPI(
    title="AI Smart Grid Intelligence Platform",
    description="Enterprise-grade AI-powered smart grid monitoring, analytics, and control system",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:4173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(grid_router)
app.include_router(analytics_router)
app.include_router(inspections_router)
app.include_router(copilot_router)
app.include_router(websocket_router)
app.include_router(ml_router)


@app.get("/")
async def root():
    return {
        "name": "AI Smart Grid Intelligence Platform",
        "version": "2.0.0",
        "status": "operational",
        "docs": "/docs",
        "ml_endpoints": "/api/ml",
    }


@app.get("/health")
async def health():
    try:
        ml_health = model_loader.registry.health()
        loaded = sum(1 for v in ml_health.values() if v.get("loaded"))
    except Exception:
        ml_health = {}
        loaded = 0
    return {
        "status": "healthy",
        "api": "online",
        "ml_models_loaded": loaded,
        "ml_models_total": len(ml_health),
    }

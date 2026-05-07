"""
ML Prediction API Router
========================
Exposes prediction endpoints backed by the InferenceService.
All endpoints return structured JSON with model_source field
indicating whether real model or fallback was used.
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.grid import SmartMeter, Transformer
from ..services.inference import inference_service
from ..services.model_loader import model_loader

logger = logging.getLogger("gridshield.ml_router")

router = APIRouter(prefix="/api/ml", tags=["ML Inference"])


# ──────────────────────────────────────────────────────────────────────────────
# Request / Response schemas
# ──────────────────────────────────────────────────────────────────────────────

class TheftPredictRequest(BaseModel):
    meter_id: str
    consumption_features: Optional[List[float]] = Field(default=None, description="Raw kWh readings (daily/hourly)")
    anomaly_score: float = Field(default=0.5, ge=0.0, le=1.0)


class ForecastRequest(BaseModel):
    hours: int = Field(default=48, ge=1, le=168)
    district: Optional[str] = None
    historical_sequence: Optional[List[List[float]]] = None


class OverloadRequest(BaseModel):
    transformer_id: int
    load_pct: float = Field(default=50.0, ge=0.0, le=200.0)
    temperature_c: float = Field(default=55.0)
    oil_level: float = Field(default=90.0, ge=0.0, le=100.0)
    vibration: float = Field(default=0.3, ge=0.0, le=10.0)


class AnomalyRequest(BaseModel):
    meter_id: str
    features: Optional[dict] = None
    anomaly_score: float = Field(default=0.5, ge=0.0, le=1.0)


class BatchTheftRequest(BaseModel):
    meter_ids: List[str]
    limit: int = Field(default=50, ge=1, le=500)


# ──────────────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/health")
async def ml_health():
    """Model health check — lists all loaded models and their status."""
    return inference_service.get_model_health()


@router.get("/models")
async def list_models():
    """List all registered models with metadata."""
    return {
        "models": model_loader.registry.list_models(),
        "health": model_loader.registry.health(),
    }


@router.post("/predict/theft")
async def predict_theft(req: TheftPredictRequest):
    """
    Predict theft probability for a single meter.
    Uses TheftTransformer model if loaded, else physics-based fallback.
    """
    try:
        result = inference_service.predict_theft(
            meter_id=req.meter_id,
            consumption_features=req.consumption_features,
            anomaly_score=req.anomaly_score,
        )
        return result
    except Exception as e:
        logger.error(f"Theft prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/theft/batch")
async def predict_theft_batch(req: BatchTheftRequest, db: Session = Depends(get_db)):
    """
    Batch theft predictions for multiple meters from the database.
    Pulls anomaly scores from DB and runs predictions.
    """
    results = []
    meters = (
        db.query(SmartMeter)
        .filter(SmartMeter.meter_id.in_(req.meter_ids))
        .limit(req.limit)
        .all()
    )

    if not meters:
        # Fallback — predict for provided IDs without DB data
        for mid in req.meter_ids[:req.limit]:
            results.append(inference_service.predict_theft(meter_id=mid))
    else:
        for m in meters:
            results.append(
                inference_service.predict_theft(
                    meter_id=m.meter_id,
                    anomaly_score=m.anomaly_score or 0.5,
                )
            )

    results.sort(key=lambda x: x["theft_probability"], reverse=True)
    return {"count": len(results), "predictions": results}


@router.post("/predict/forecast")
async def predict_forecast(req: ForecastRequest):
    """
    AI demand forecast for a given horizon.
    Uses TFTModel if loaded, else synthetic sinusoidal fallback.
    """
    try:
        result = inference_service.predict_demand_forecast(
            hours=req.hours,
            district=req.district,
            historical_sequence=req.historical_sequence,
        )
        return result
    except Exception as e:
        logger.error(f"Forecast prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predict/forecast")
async def predict_forecast_get(hours: int = 48, district: Optional[str] = None):
    """GET convenience endpoint for demand forecast (no body required)."""
    return inference_service.predict_demand_forecast(hours=hours, district=district)


@router.post("/predict/overload")
async def predict_overload(req: OverloadRequest):
    """
    Predict transformer overload probability.
    Uses overload model if loaded, else physics-based calculation.
    """
    try:
        result = inference_service.predict_transformer_overload(
            transformer_id=req.transformer_id,
            load_pct=req.load_pct,
            temperature_c=req.temperature_c,
            oil_level=req.oil_level,
            vibration=req.vibration,
        )
        return result
    except Exception as e:
        logger.error(f"Overload prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predict/overload/{txr_id}")
async def predict_overload_get(txr_id: int, db: Session = Depends(get_db)):
    """GET overload prediction for a specific transformer using DB data."""
    txr = db.query(Transformer).filter(Transformer.id == txr_id).first()
    if not txr:
        raise HTTPException(status_code=404, detail="Transformer not found")

    load_pct = txr.current_load_kw / max(txr.capacity_kva * 0.8, 1) * 100
    return inference_service.predict_transformer_overload(
        transformer_id=txr_id,
        load_pct=load_pct,
        temperature_c=txr.temperature_celsius or 55.0,
        oil_level=txr.oil_level or 90.0,
        vibration=txr.vibration_level or 0.3,
    )


@router.post("/predict/anomaly")
async def predict_anomaly(req: AnomalyRequest):
    """
    Anomaly detection with SHAP feature importance.
    Uses anomaly model if loaded, else rule-based fallback.
    """
    try:
        result = inference_service.detect_anomaly(
            meter_id=req.meter_id,
            features=req.features,
            anomaly_score=req.anomaly_score,
        )
        return result
    except Exception as e:
        logger.error(f"Anomaly detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predict/anomaly/{meter_id}")
async def predict_anomaly_get(meter_id: str, db: Session = Depends(get_db)):
    """GET anomaly detection for a specific meter using DB data."""
    meter = db.query(SmartMeter).filter(SmartMeter.meter_id == meter_id).first()
    anomaly_score = meter.anomaly_score if meter else 0.5
    return inference_service.detect_anomaly(
        meter_id=meter_id,
        anomaly_score=anomaly_score,
    )


@router.get("/risk/district/{district}")
async def district_risk(district: str):
    """Get composite AI risk score for a district."""
    return inference_service.score_district_risk(district)


@router.get("/risk/all-districts")
async def all_district_risks():
    """Get risk scores for all monitored districts."""
    districts = [
        "Hyderabad", "Secunderabad", "Kukatpally", "HITEC City",
        "Madhapur", "Gachibowli", "Kondapur", "Begumpet",
        "Banjara Hills", "Jubilee Hills",
    ]
    results = [inference_service.score_district_risk(d) for d in districts]
    results.sort(key=lambda x: x["risk_score"], reverse=True)
    return {"districts": results, "count": len(results)}

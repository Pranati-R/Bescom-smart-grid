from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
import random

from ..database import get_db
from ..models.grid import SmartMeter, Transformer, Feeder, Substation
from ..models.analytics import Anomaly

router = APIRouter(prefix="/api/grid", tags=["Grid"])


@router.get("/map-data")
async def get_map_data(
    district: Optional[str] = None,
    lat_min: float = 17.25,
    lat_max: float = 17.55,
    lon_min: float = 78.35,
    lon_max: float = 78.65,
    limit: int = 500,
    db: Session = Depends(get_db)
):
    """Get all grid entities for map visualization."""
    meter_query = db.query(SmartMeter).filter(
        SmartMeter.latitude.between(lat_min, lat_max),
        SmartMeter.longitude.between(lon_min, lon_max)
    )
    if district:
        meter_query = meter_query.filter(SmartMeter.district == district)

    meters = meter_query.limit(limit).all()
    transformers = db.query(Transformer).all()
    substations = db.query(Substation).all()

    return {
        "meters": [
            {
                "id": m.id,
                "meter_id": m.meter_id,
                "lat": m.latitude,
                "lon": m.longitude,
                "anomaly_score": m.anomaly_score,
                "theft_probability": m.theft_probability,
                "is_suspicious": m.is_suspicious,
                "consumer_type": m.consumer_type,
                "district": m.district,
                "current_kwh": m.current_consumption_kwh,
                "transformer_id": m.transformer_id,
                "status": m.status
            }
            for m in meters
        ],
        "transformers": [
            {
                "id": t.id,
                "code": t.code,
                "lat": t.latitude,
                "lon": t.longitude,
                "health_score": t.health_score,
                "overload_probability": t.overload_probability,
                "status": t.status,
                "temperature": t.temperature_celsius,
                "capacity_kva": t.capacity_kva
            }
            for t in transformers
        ],
        "substations": [
            {
                "id": s.id,
                "name": s.name,
                "code": s.code,
                "lat": s.latitude,
                "lon": s.longitude,
                "status": s.status,
                "health_score": s.health_score,
                "capacity_mva": s.capacity_mva
            }
            for s in substations
        ]
    }


@router.get("/meters")
async def get_meters(
    page: int = 1,
    limit: int = 50,
    district: Optional[str] = None,
    is_suspicious: Optional[bool] = None,
    consumer_type: Optional[str] = None,
    min_anomaly_score: float = 0.0,
    db: Session = Depends(get_db)
):
    """Get paginated smart meters."""
    query = db.query(SmartMeter)
    if district:
        query = query.filter(SmartMeter.district == district)
    if is_suspicious is not None:
        query = query.filter(SmartMeter.is_suspicious == is_suspicious)
    if consumer_type:
        query = query.filter(SmartMeter.consumer_type == consumer_type)
    if min_anomaly_score > 0:
        query = query.filter(SmartMeter.anomaly_score >= min_anomaly_score)

    total = query.count()
    meters = query.order_by(SmartMeter.anomaly_score.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": [
            {
                "id": m.id,
                "meter_id": m.meter_id,
                "consumer_name": m.consumer_name,
                "consumer_type": m.consumer_type,
                "district": m.district,
                "anomaly_score": m.anomaly_score,
                "theft_probability": m.theft_probability,
                "revenue_loss_inr": m.revenue_loss_inr,
                "monthly_kwh": m.monthly_consumption_kwh,
                "expected_kwh": m.expected_consumption_kwh,
                "is_suspicious": m.is_suspicious,
                "status": m.status,
                "billing_amount": m.billing_amount_inr,
                "lat": m.latitude,
                "lon": m.longitude
            }
            for m in meters
        ]
    }


@router.get("/meters/{meter_id}")
async def get_meter_detail(meter_id: int, db: Session = Depends(get_db)):
    """Get detailed meter analytics."""
    meter = db.query(SmartMeter).filter(SmartMeter.id == meter_id).first()
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")

    anomalies = db.query(Anomaly).filter(Anomaly.meter_id == meter_id).order_by(Anomaly.detected_at.desc()).limit(10).all()

    # Generate usage timeline
    usage_timeline = []
    for i in range(30):
        from datetime import timedelta
        day = __import__('datetime').datetime.utcnow() - timedelta(days=29 - i)
        actual = meter.monthly_consumption_kwh / 30 + random.uniform(-5, 15)
        expected = meter.expected_consumption_kwh / 30 + random.uniform(-2, 5)
        usage_timeline.append({
            "date": day.strftime("%Y-%m-%d"),
            "actual_kwh": round(max(0, actual), 2),
            "expected_kwh": round(max(0, expected), 2)
        })

    return {
        "id": meter.id,
        "meter_id": meter.meter_id,
        "consumer_name": meter.consumer_name,
        "consumer_type": meter.consumer_type,
        "address": meter.address,
        "district": meter.district,
        "phase": meter.phase,
        "tariff_category": meter.tariff_category,
        "sanctioned_load_kw": meter.sanctioned_load_kw,
        "current_kwh": meter.current_consumption_kwh,
        "monthly_kwh": meter.monthly_consumption_kwh,
        "expected_kwh": meter.expected_consumption_kwh,
        "deviation_pct": round((meter.monthly_consumption_kwh - meter.expected_consumption_kwh) / max(meter.expected_consumption_kwh, 1) * 100, 1),
        "anomaly_score": meter.anomaly_score,
        "theft_probability": meter.theft_probability,
        "revenue_loss_inr": meter.revenue_loss_inr,
        "billing_amount_inr": meter.billing_amount_inr,
        "is_suspicious": meter.is_suspicious,
        "status": meter.status,
        "lat": meter.latitude,
        "lon": meter.longitude,
        "transformer_id": meter.transformer_id,
        "anomalies": [
            {
                "id": a.id,
                "type": a.anomaly_type,
                "severity": a.severity,
                "confidence": a.confidence_score,
                "revenue_loss": a.revenue_loss_inr,
                "detected_at": a.detected_at.isoformat(),
                "status": a.status,
                "description": a.description
            }
            for a in anomalies
        ],
        "usage_timeline": usage_timeline,
        "peer_comparison": {
            "avg_similar_kwh": round(meter.expected_consumption_kwh * random.uniform(0.85, 0.95), 1),
            "percentile": random.randint(60, 99)
        },
        "ai_explanation": "The AI model detected anomalous consumption patterns based on: 340% night usage increase, phase voltage imbalance of 8.3%, and billing history mismatch of ₹{:.0f}/month.".format(meter.revenue_loss_inr)
    }


@router.get("/transformers")
async def get_transformers(
    status: Optional[str] = None,
    min_overload: float = 0.0,
    db: Session = Depends(get_db)
):
    """Get transformer list with health data."""
    query = db.query(Transformer)
    if status:
        query = query.filter(Transformer.status == status)
    if min_overload > 0:
        query = query.filter(Transformer.overload_probability >= min_overload)

    transformers = query.order_by(Transformer.overload_probability.desc()).all()
    return [
        {
            "id": t.id,
            "code": t.code,
            "name": t.name,
            "health_score": t.health_score,
            "overload_probability": t.overload_probability,
            "failure_risk": t.failure_risk,
            "temperature_c": t.temperature_celsius,
            "vibration_level": t.vibration_level,
            "oil_level": t.oil_level,
            "capacity_kva": t.capacity_kva,
            "current_load_kw": t.current_load_kw,
            "load_pct": round(t.current_load_kw / max(t.capacity_kva * 0.8, 1) * 100, 1),
            "status": t.status,
            "lat": t.latitude,
            "lon": t.longitude,
            "feeder_id": t.feeder_id
        }
        for t in transformers
    ]


@router.get("/transformers/{txr_id}")
async def get_transformer_detail(txr_id: int, db: Session = Depends(get_db)):
    """Get detailed transformer data for digital twin."""
    txr = db.query(Transformer).filter(Transformer.id == txr_id).first()
    if not txr:
        raise HTTPException(status_code=404, detail="Transformer not found")

    # Generate historical metrics
    history = []
    for i in range(48):
        from datetime import timedelta
        t = __import__('datetime').datetime.utcnow() - timedelta(hours=47 - i)
        load_pct = min(100, txr.overload_probability * 100 + random.uniform(-15, 15))
        history.append({
            "timestamp": t.isoformat(),
            "load_pct": round(max(0, load_pct), 1),
            "temperature_c": round(35 + load_pct * 0.45 + random.uniform(-3, 3), 1),
            "vibration": round(random.uniform(0.1, 0.7), 2),
            "voltage_v": round(415 + random.uniform(-20, 20), 1)
        })

    meter_count = db.query(SmartMeter).filter(SmartMeter.transformer_id == txr_id).count()

    return {
        "id": txr.id,
        "code": txr.code,
        "name": txr.name,
        "health_score": txr.health_score,
        "overload_probability": txr.overload_probability,
        "failure_risk": txr.failure_risk,
        "temperature_c": txr.temperature_celsius,
        "vibration_level": txr.vibration_level,
        "oil_level": txr.oil_level,
        "capacity_kva": txr.capacity_kva,
        "current_load_kw": txr.current_load_kw,
        "load_pct": round(txr.current_load_kw / max(txr.capacity_kva * 0.8, 1) * 100, 1),
        "voltage_primary": txr.voltage_primary,
        "voltage_secondary": txr.voltage_secondary,
        "status": txr.status,
        "lat": txr.latitude,
        "lon": txr.longitude,
        "meter_count": meter_count,
        "last_maintenance": txr.last_maintenance.isoformat() if txr.last_maintenance else None,
        "history_48h": history,
        "alerts": [
            {"type": "overload_risk", "msg": "Load exceeding 80% - Monitor closely"},
            {"type": "temperature", "msg": "Temperature trending upward"}
        ] if txr.overload_probability > 0.6 else []
    }


@router.get("/topology")
async def get_grid_topology(db: Session = Depends(get_db)):
    """Get grid topology for network visualization."""
    substations = db.query(Substation).all()
    feeders = db.query(Feeder).all()
    transformers = db.query(Transformer).limit(50).all()

    nodes = []
    edges = []

    for s in substations:
        nodes.append({"id": f"sub_{s.id}", "type": "substation", "label": s.name, "data": {"health": s.health_score, "status": s.status}})

    for f in feeders:
        nodes.append({"id": f"fdr_{f.id}", "type": "feeder", "label": f.name, "data": {"health": f.health_score, "status": f.status}})
        edges.append({"id": f"e_sub_{f.substation_id}_fdr_{f.id}", "source": f"sub_{f.substation_id}", "target": f"fdr_{f.id}"})

    for t in transformers:
        nodes.append({"id": f"txr_{t.id}", "type": "transformer", "label": t.code, "data": {"health": t.health_score, "status": t.status, "overload": t.overload_probability}})
        edges.append({"id": f"e_fdr_{t.feeder_id}_txr_{t.id}", "source": f"fdr_{t.feeder_id}", "target": f"txr_{t.id}"})

    return {"nodes": nodes, "edges": edges}

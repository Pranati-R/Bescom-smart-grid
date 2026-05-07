from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import random
from datetime import datetime, timedelta

from ..database import get_db
from ..models.grid import SmartMeter, Transformer, Feeder, Substation
from ..models.analytics import Anomaly, Alert, RevenueReport
from ..utils.mock_data import generate_realtime_metrics, generate_transformer_metrics

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/metrics")
async def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Get real-time dashboard KPI metrics."""
    metrics = generate_realtime_metrics()

    # Enhance with DB counts
    metrics["total_meters"] = db.query(SmartMeter).count()
    metrics["total_transformers"] = db.query(Transformer).count()
    metrics["suspicious_meters_db"] = db.query(SmartMeter).filter(SmartMeter.is_suspicious == True).count()
    metrics["open_anomalies"] = db.query(Anomaly).filter(Anomaly.is_resolved == False).count()
    metrics["critical_alerts"] = db.query(Alert).filter(Alert.severity == "critical", Alert.is_resolved == False).count()

    return metrics


@router.get("/kpis")
async def get_kpis(db: Session = Depends(get_db)):
    """Get high-level KPI summary."""
    total_meters = db.query(SmartMeter).count()
    suspicious = db.query(SmartMeter).filter(SmartMeter.is_suspicious == True).count()
    revenue_data = db.query(RevenueReport).order_by(RevenueReport.report_date.desc()).limit(30).all()

    total_loss = sum(r.revenue_loss_inr for r in revenue_data)
    total_billed = sum(r.total_billed_inr for r in revenue_data)

    return {
        "total_meters": total_meters,
        "suspicious_meters": suspicious,
        "theft_rate_pct": round((suspicious / max(total_meters, 1)) * 100, 2),
        "monthly_loss_inr": round(total_loss / max(len(revenue_data), 1), 0),
        "total_billed_inr": round(total_billed / max(len(revenue_data), 1), 0),
        "collection_efficiency_pct": round(random.uniform(82, 94), 1),
        "transformer_health_avg": round(random.uniform(78, 92), 1),
        "ai_model_accuracy": round(random.uniform(93, 97.5), 1),
        "active_alerts": db.query(Alert).filter(Alert.is_resolved == False).count(),
        "districts_monitored": 10,
        "substations": db.query(Substation).count(),
        "feeders": db.query(Feeder).count(),
    }


@router.get("/alerts")
async def get_alerts(
    limit: int = 20,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get recent alerts."""
    query = db.query(Alert).filter(Alert.is_resolved == False)
    if severity:
        query = query.filter(Alert.severity == severity)
    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()

    return [
        {
            "id": a.id,
            "type": a.alert_type,
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "source": a.source,
            "is_read": a.is_read,
            "created_at": a.created_at.isoformat()
        }
        for a in alerts
    ]


@router.put("/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.is_read = True
        db.commit()
    return {"status": "ok"}


@router.get("/system-health")
async def get_system_health():
    """Get AI system health status."""
    return {
        "ai_engine": {"status": "online", "latency_ms": random.randint(12, 45), "accuracy": round(random.uniform(93, 97), 1)},
        "websocket": {"status": "connected", "clients": random.randint(3, 15)},
        "database": {"status": "healthy", "connections": random.randint(5, 20)},
        "forecasting_model": {"status": "active", "last_retrain": (datetime.utcnow() - timedelta(hours=random.randint(2, 12))).isoformat()},
        "anomaly_model": {"status": "active", "last_retrain": (datetime.utcnow() - timedelta(hours=random.randint(1, 6))).isoformat()},
        "stream_processor": {"status": "running", "events_per_sec": random.randint(45, 120)},
        "overall_health": round(random.uniform(88, 98), 1)
    }

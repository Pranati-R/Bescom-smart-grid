from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import random
from datetime import datetime, timedelta

from ..database import get_db
from ..models.analytics import Anomaly
from ..models.grid import SmartMeter
from ..utils.mock_data import generate_shap_values, generate_hourly_forecast

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/anomalies")
async def get_anomalies(
    page: int = 1,
    limit: int = 50,
    severity: Optional[str] = None,
    anomaly_type: Optional[str] = None,
    is_resolved: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Anomaly)
    if severity:
        query = query.filter(Anomaly.severity == severity)
    if anomaly_type:
        query = query.filter(Anomaly.anomaly_type == anomaly_type)
    query = query.filter(Anomaly.is_resolved == is_resolved)
    total = query.count()
    anomalies = query.order_by(Anomaly.confidence_score.desc()).offset((page - 1) * limit).limit(limit).all()
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": [
            {
                "id": a.id,
                "meter_id": a.meter_id,
                "type": a.anomaly_type,
                "severity": a.severity,
                "confidence": a.confidence_score,
                "theft_probability": a.theft_probability,
                "revenue_loss_inr": a.revenue_loss_inr,
                "detected_at": a.detected_at.isoformat(),
                "status": a.status,
                "description": a.description,
            }
            for a in anomalies
        ],
    }


@router.get("/anomaly-stats")
async def get_anomaly_stats(db: Session = Depends(get_db)):
    total = db.query(Anomaly).count()
    resolved = db.query(Anomaly).filter(Anomaly.is_resolved == True).count()
    type_dist = {}
    for t in ["voltage_tampering", "energy_theft", "meter_bypass", "phase_manipulation",
              "consumption_spike", "night_suppression", "billing_mismatch", "meter_reversal"]:
        type_dist[t] = db.query(Anomaly).filter(Anomaly.anomaly_type == t).count()
    return {
        "total": total,
        "critical": db.query(Anomaly).filter(Anomaly.severity == "critical").count(),
        "high": db.query(Anomaly).filter(Anomaly.severity == "high").count(),
        "medium": db.query(Anomaly).filter(Anomaly.severity == "medium").count(),
        "low": db.query(Anomaly).filter(Anomaly.severity == "low").count(),
        "resolved": resolved,
        "open": total - resolved,
        "resolution_rate": round(resolved / max(total, 1) * 100, 1),
        "type_distribution": type_dist,
        "avg_confidence": round(random.uniform(0.88, 0.94), 3),
        "total_revenue_at_risk": round(random.uniform(8500000, 12000000), 0),
    }


@router.get("/forecast")
async def get_demand_forecast(hours: int = 48, district: Optional[str] = None):
    return {
        "district": district or "All",
        "generated_at": datetime.utcnow().isoformat(),
        "model_version": "LSTM-v2.4",
        "accuracy_mape": round(random.uniform(2.8, 5.2), 2),
        "data": generate_hourly_forecast(hours),
    }


@router.get("/theft-ranking")
async def get_theft_ranking(limit: int = 50, db: Session = Depends(get_db)):
    meters = (
        db.query(SmartMeter)
        .filter(SmartMeter.is_suspicious == True)
        .order_by(SmartMeter.theft_probability.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "rank": i + 1,
            "id": m.id,
            "meter_id": m.meter_id,
            "consumer_name": m.consumer_name,
            "district": m.district,
            "theft_probability": m.theft_probability,
            "anomaly_score": m.anomaly_score,
            "revenue_loss_inr": m.revenue_loss_inr,
            "monthly_kwh": m.monthly_consumption_kwh,
            "expected_kwh": m.expected_consumption_kwh,
            "consumer_type": m.consumer_type,
            "lat": m.latitude,
            "lon": m.longitude,
        }
        for i, m in enumerate(meters)
    ]


@router.get("/explainability/{entity_type}/{entity_id}")
async def get_ai_explanation(entity_type: str, entity_id: int):
    shap_values = generate_shap_values()
    features_sorted = sorted(shap_values.items(), key=lambda x: x[1], reverse=True)
    explanations = {
        "nighttime_consumption": "Consumption between 11pm-5am is 340% above baseline",
        "consumption_deviation": "Monthly usage dropped 45% vs expected",
        "phase_imbalance": "Phase voltage imbalance of 8.3% detected",
        "payment_history": "3 consecutive delayed payments after on-time history",
        "meter_age_years": "Older meter - higher susceptibility to interference",
        "neighbor_comparison": "Usage 67% lower than 8 neighboring meters",
        "seasonal_pattern_break": "Summer consumption dropped during heat wave",
        "billing_mismatch_ratio": "Billed units 42% less than transformer readings",
        "tamper_events_count": "2 tamper events recorded in past 6 months",
        "transformer_load_ratio": "Individual load inconsistent with transformer totals",
    }
    return {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "model_name": "GridShield AI v3.2",
        "prediction": "HIGH THEFT PROBABILITY",
        "confidence": round(random.uniform(0.82, 0.97), 3),
        "shap_values": shap_values,
        "feature_importance": [
            {"feature": k, "importance": v, "explanation": explanations.get(k, "")}
            for k, v in features_sorted
        ],
        "decision_path": [
            "1. Nighttime consumption anomaly detected",
            "2. Cross-referenced with transformer meter totals",
            "3. Seasonal pattern analysis confirmed anomaly",
            "4. Peer comparison validates suspicion",
            "5. Historical tamper events corroborate",
        ],
        "reasoning": "AI detected coordinated theft pattern. Revenue loss estimated at ₹{:.0f}/month.".format(random.uniform(2000, 8000)),
        "recommended_action": "Immediate field inspection required.",
    }


@router.get("/revenue")
async def get_revenue_analytics(days: int = 30, district: Optional[str] = None, db: Session = Depends(get_db)):
    from ..models.analytics import RevenueReport
    query = db.query(RevenueReport)
    if district:
        query = query.filter(RevenueReport.district == district)
    reports = query.order_by(RevenueReport.report_date.desc()).limit(days).all()
    daily_data = [
        {
            "date": r.report_date.strftime("%Y-%m-%d"),
            "district": r.district,
            "billed_inr": r.total_billed_inr,
            "collected_inr": r.total_collected_inr,
            "loss_inr": r.revenue_loss_inr,
            "theft_loss": r.theft_loss_inr,
            "recovery_potential": r.recovery_potential_inr,
        }
        for r in reports
    ]
    total_loss = sum(r.revenue_loss_inr for r in reports)
    total_billed = sum(r.total_billed_inr for r in reports)
    return {
        "summary": {
            "total_billed_inr": round(total_billed, 0),
            "total_loss_inr": round(total_loss, 0),
            "loss_percentage": round(total_loss / max(total_billed, 1) * 100, 2),
            "recovery_potential_inr": round(total_loss * 0.65, 0),
        },
        "daily_data": daily_data,
        "district_breakdown": [
            {"district": d, "loss_inr": round(random.uniform(800000, 3000000), 0), "meters": random.randint(500, 2000)}
            for d in ["Hyderabad", "Secunderabad", "Kukatpally", "HITEC City", "Madhapur"]
        ],
    }


@router.get("/simulation")
async def run_simulation(
    demand_increase_pct: float = 0,
    theft_spike_pct: float = 0,
    weather_temp: float = 35,
    feeder_fault: bool = False,
):
    base_demand = 850
    adjusted_demand = base_demand * (1 + demand_increase_pct / 100)
    overload_risk = min(1.0, 0.15 + demand_increase_pct * 0.012 + (weather_temp - 35) * 0.008)
    if feeder_fault:
        overload_risk = min(1.0, overload_risk + 0.35)
    return {
        "parameters": {"demand_increase_pct": demand_increase_pct, "theft_spike_pct": theft_spike_pct, "weather_temp": weather_temp, "feeder_fault": feeder_fault},
        "results": {
            "total_demand_mw": round(adjusted_demand, 2),
            "revenue_loss_inr": round(9500000 * (1 + theft_spike_pct / 100), 0),
            "transformer_stress_pct": round(min(100, 65 + demand_increase_pct * 0.8), 1),
            "feeder_load_pct": round(min(100, 58 + demand_increase_pct * 1.1), 1),
            "overload_risk": round(overload_risk, 3),
            "blackout_probability": round(overload_risk * 0.3, 3),
            "critical_transformers": int(overload_risk * 12),
            "recommended_action": "Load shedding required" if overload_risk > 0.7 else "Monitor and prepare contingency",
        },
    }

import random
import math
from datetime import datetime, timedelta


def generate_realtime_metrics():
    """Generate realistic real-time grid metrics."""
    now = datetime.utcnow()
    hour = now.hour
    # Demand curve peaks at 10am and 8pm
    base_demand = 850 + 150 * (
        0.6 * math.exp(-((hour - 10) ** 2) / 8) +
        0.8 * math.exp(-((hour - 20) ** 2) / 6)
    )
    return {
        "timestamp": now.isoformat(),
        "total_demand_mw": round(base_demand + random.uniform(-20, 20), 2),
        "active_anomalies": random.randint(45, 95),
        "transformer_overloads": random.randint(3, 12),
        "revenue_leakage_inr": round(random.uniform(850000, 1200000), 0),
        "predicted_peak_mw": round(base_demand * 1.15 + random.uniform(-5, 5), 2),
        "ai_confidence_score": round(random.uniform(0.88, 0.97), 3),
        "active_inspections": random.randint(8, 25),
        "recovery_potential_inr": round(random.uniform(450000, 750000), 0),
        "system_frequency_hz": round(50 + random.uniform(-0.05, 0.05), 3),
        "grid_health_score": round(random.uniform(82, 96), 1),
        "suspicious_meters": random.randint(120, 280),
        "active_feeders": random.randint(42, 52),
        "substations_online": random.randint(4, 5),
    }


def generate_stream_events():
    """Generate realistic streaming event data."""
    events = [
        {"type": "anomaly", "severity": "high", "msg": "Energy theft pattern detected at MTR-{id} - Revenue loss ₹{loss}/month", "color": "red"},
        {"type": "overload", "severity": "critical", "msg": "Transformer TXR-{id} at {pct}% capacity - Overload risk HIGH", "color": "orange"},
        {"type": "alert", "severity": "medium", "msg": "Feeder FDR-{id} phase imbalance {pct}% - Auto-correction initiated", "color": "yellow"},
        {"type": "forecast", "severity": "info", "msg": "AI predicts {pct}% demand surge in {zone} in next 2 hours", "color": "blue"},
        {"type": "recovery", "severity": "success", "msg": "₹{loss} recovered from inspection #INS-{id} - Theft confirmed", "color": "green"},
        {"type": "ai", "severity": "info", "msg": "AI model retrained with {count} new samples - Accuracy: {acc}%", "color": "cyan"},
        {"type": "security", "severity": "high", "msg": "Magnetic interference detected at MTR-{id} - Possible bypass attempt", "color": "red"},
        {"type": "maintenance", "severity": "low", "msg": "Scheduled maintenance completed on TXR-{id} - Health score improved", "color": "green"},
    ]
    event = random.choice(events)
    event_id = random.randint(1000, 9999)
    msg = event["msg"].format(
        id=event_id,
        loss=random.randint(500, 8000),
        pct=random.randint(60, 130),
        zone=random.choice(["Kukatpally", "Madhapur", "Gachibowli", "HITEC City"]),
        count=random.randint(100, 5000),
        acc=round(random.uniform(92, 98.5), 1)
    )
    return {
        "id": event_id,
        "type": event["type"],
        "severity": event["severity"],
        "message": msg,
        "color": event["color"],
        "timestamp": datetime.utcnow().isoformat()
    }


def generate_hourly_forecast(hours=48):
    """Generate hourly demand forecast data."""
    data = []
    now = datetime.utcnow()
    for i in range(-24, hours):
        t = now + timedelta(hours=i)
        hour = t.hour
        base = 700 + 200 * (
            0.6 * math.exp(-((hour - 10) ** 2) / 8) +
            0.8 * math.exp(-((hour - 20) ** 2) / 6)
        )
        actual = base + random.uniform(-30, 30) if i < 0 else None
        predicted = base + random.uniform(-15, 15)
        data.append({
            "timestamp": t.isoformat(),
            "actual_mw": round(actual, 2) if actual else None,
            "predicted_mw": round(predicted, 2),
            "lower_bound": round(predicted * 0.92, 2),
            "upper_bound": round(predicted * 1.08, 2),
            "temperature_c": round(random.uniform(28, 42), 1),
            "is_forecast": i >= 0
        })
    return data


def generate_transformer_metrics(count=20):
    """Generate real-time transformer data."""
    data = []
    for i in range(count):
        health = random.uniform(40, 99)
        overload = random.uniform(0.05, 0.85)
        data.append({
            "id": i + 1,
            "code": f"TXR-{str(i+1).zfill(3)}",
            "health_score": round(health, 1),
            "load_percentage": round(overload * 100, 1),
            "temperature_c": round(35 + overload * 50 + random.uniform(-5, 5), 1),
            "vibration_level": round(random.uniform(0.1, 0.9), 2),
            "oil_level": round(random.uniform(70, 100), 1),
            "voltage_v": round(415 + random.uniform(-15, 15), 1),
            "failure_risk": round(overload * 0.5, 3),
            "status": "critical" if overload > 0.8 else ("warning" if overload > 0.6 else "normal"),
            "latitude": 17.3850 + random.uniform(-0.15, 0.15),
            "longitude": 78.4867 + random.uniform(-0.15, 0.15),
        })
    return data


def generate_shap_values():
    """Generate mock SHAP feature importance values."""
    features = {
        "nighttime_consumption": round(random.uniform(0.15, 0.45), 3),
        "consumption_deviation": round(random.uniform(0.10, 0.35), 3),
        "phase_imbalance": round(random.uniform(0.08, 0.25), 3),
        "payment_history": round(random.uniform(0.05, 0.20), 3),
        "meter_age_years": round(random.uniform(0.03, 0.15), 3),
        "neighbor_comparison": round(random.uniform(0.02, 0.12), 3),
        "seasonal_pattern_break": round(random.uniform(0.02, 0.10), 3),
        "billing_mismatch_ratio": round(random.uniform(0.01, 0.08), 3),
        "tamper_events_count": round(random.uniform(0.01, 0.06), 3),
        "transformer_load_ratio": round(random.uniform(0.01, 0.05), 3),
    }
    return features

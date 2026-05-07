import random
import math
from datetime import datetime, timedelta
from faker import Faker
from sqlalchemy.orm import Session
from ..models.grid import SmartMeter, Feeder, Transformer, Substation
from ..models.analytics import Anomaly, Forecast, Alert, RevenueReport
from ..models.inspection import Inspection
from ..models.user import User
from ..models.ai import AIExplanation

fake = Faker("en_IN")

DISTRICTS = ["Hyderabad", "Secunderabad", "Kukatpally", "HITEC City", "Madhapur",
             "Gachibowli", "Kondapur", "Begumpet", "Banjara Hills", "Jubilee Hills"]

ANOMALY_TYPES = [
    "voltage_tampering", "energy_theft", "meter_bypass",
    "phase_manipulation", "consumption_spike", "night_suppression",
    "billing_mismatch", "meter_reversal", "magnetic_interference"
]


def seed_database(db: Session):
    """Seed the database with realistic demo data."""
    if db.query(Substation).count() > 0:
        return  # Already seeded

    print("Seeding database with demo data...")

    # Create substations
    substations = []
    for i in range(5):
        district = DISTRICTS[i]
        lat = 17.3850 + random.uniform(-0.15, 0.15)
        lon = 78.4867 + random.uniform(-0.15, 0.15)
        sub = Substation(
            name=f"{district} Main Substation",
            code=f"SS-{str(i+1).zfill(3)}",
            latitude=lat,
            longitude=lon,
            capacity_mva=random.uniform(80, 200),
            current_load_mw=random.uniform(40, 120),
            voltage_kv=random.choice([33.0, 66.0, 132.0]),
            status=random.choice(["active", "active", "active", "maintenance"]),
            health_score=random.uniform(75, 99),
            district=district,
            city="Hyderabad"
        )
        db.add(sub)
        substations.append(sub)

    db.flush()

    # Create feeders
    feeders = []
    for sub in substations:
        for j in range(random.randint(3, 6)):
            feeder = Feeder(
                name=f"{sub.district} Feeder {j+1}",
                code=f"FDR-{sub.code}-{str(j+1).zfill(2)}",
                substation_id=sub.id,
                capacity_mw=random.uniform(5, 15),
                current_load_mw=random.uniform(2, 10),
                length_km=random.uniform(2, 12),
                status=random.choice(["active", "active", "active", "fault"]),
                health_score=random.uniform(70, 98),
                overload_risk=random.uniform(0.05, 0.45)
            )
            db.add(feeder)
            feeders.append(feeder)

    db.flush()

    # Create transformers
    transformers = []
    for feeder in feeders:
        for k in range(random.randint(4, 8)):
            lat = random.uniform(17.25, 17.55)
            lon = random.uniform(78.35, 78.65)
            overload_prob = random.uniform(0.05, 0.55)
            txr = Transformer(
                name=f"{feeder.name} DT-{k+1}",
                code=f"TXR-{feeder.code}-{str(k+1).zfill(2)}",
                feeder_id=feeder.id,
                latitude=lat,
                longitude=lon,
                capacity_kva=random.choice([100, 250, 400, 630]),
                current_load_kw=random.uniform(30, 300),
                temperature_celsius=random.uniform(35, 85),
                vibration_level=random.uniform(0.1, 0.9),
                oil_level=random.uniform(70, 100),
                health_score=random.uniform(55, 99),
                overload_probability=overload_prob,
                failure_risk=overload_prob * 0.4,
                status=random.choice(["normal", "normal", "normal", "warning", "critical"])
            )
            db.add(txr)
            transformers.append(txr)

    db.flush()

    # Create smart meters
    meters = []
    for txr in transformers:
        count = random.randint(15, 40)
        for m in range(count):
            lat = txr.latitude + random.uniform(-0.005, 0.005)
            lon = txr.longitude + random.uniform(-0.005, 0.005)
            theft_prob = random.uniform(0.0, 0.95)
            anomaly_score = theft_prob * 0.8 + random.uniform(0, 0.2)
            consumer_type = random.choices(
                ["residential", "commercial", "industrial", "agricultural"],
                weights=[60, 25, 10, 5]
            )[0]
            monthly_kwh = random.uniform(100, 2000)
            expected_kwh = monthly_kwh * random.uniform(0.8, 1.5)
            meter = SmartMeter(
                meter_id=f"MTR-{str(txr.id).zfill(4)}-{str(m+1).zfill(4)}",
                transformer_id=txr.id,
                latitude=lat,
                longitude=lon,
                consumer_name=fake.name(),
                consumer_type=consumer_type,
                sanctioned_load_kw=random.uniform(1, 20),
                current_consumption_kwh=random.uniform(0.1, 10),
                monthly_consumption_kwh=monthly_kwh,
                expected_consumption_kwh=expected_kwh,
                anomaly_score=min(anomaly_score, 1.0),
                theft_probability=min(theft_prob, 1.0),
                revenue_loss_inr=theft_prob * random.uniform(500, 5000),
                billing_amount_inr=monthly_kwh * random.uniform(5, 8),
                status="active",
                is_suspicious=theft_prob > 0.6,
                district=random.choice(DISTRICTS),
                address=fake.address(),
                phase=random.choice(["1-phase", "3-phase"]),
                tariff_category=random.choice(["LT-1", "LT-2", "HT-1", "LT-3"])
            )
            db.add(meter)
            meters.append(meter)

    db.flush()

    # Create anomalies
    for meter in random.sample(meters, min(200, len(meters))):
        num_anomalies = random.randint(1, 5)
        for _ in range(num_anomalies):
            days_ago = random.randint(1, 90)
            anomaly = Anomaly(
                meter_id=meter.id,
                anomaly_type=random.choice(ANOMALY_TYPES),
                severity=random.choice(["low", "medium", "high", "critical"]),
                confidence_score=random.uniform(0.6, 0.99),
                anomaly_score=random.uniform(0.4, 1.0),
                theft_probability=random.uniform(0.3, 0.99),
                revenue_loss_inr=random.uniform(200, 8000),
                description=f"Anomalous consumption pattern detected. Possible energy theft or tampering.",
                detected_at=datetime.utcnow() - timedelta(days=days_ago),
                is_resolved=random.random() > 0.7,
                ai_explanation="SHAP analysis shows: nighttime consumption 340% above baseline, phase voltage imbalance detected, historical pattern break after 3 months.",
                status=random.choice(["open", "investigating", "resolved", "escalated"])
            )
            db.add(anomaly)

    # Create forecasts
    for i in range(7 * 24):
        for district in DISTRICTS[:5]:
            forecast_time = datetime.utcnow() + timedelta(hours=i)
            hour = forecast_time.hour
            base_demand = 150 + 50 * math.sin((hour - 6) * math.pi / 12)
            predicted = base_demand + random.uniform(-10, 10)
            forecast = Forecast(
                district=district,
                forecast_date=forecast_time,
                horizon_hours=24,
                predicted_demand_mw=max(0, predicted),
                lower_bound_mw=max(0, predicted * 0.9),
                upper_bound_mw=predicted * 1.1,
                confidence_level=random.uniform(0.88, 0.98),
                weather_temperature=random.uniform(28, 42),
                weather_humidity=random.uniform(40, 85)
            )
            db.add(forecast)

    # Create alerts
    alert_messages = [
        ("overload", "critical", "Transformer Overload Alert", "TXR-001 operating at 127% capacity"),
        ("theft", "high", "High Theft Probability Detected", "15 meters in Kukatpally show coordinated theft pattern"),
        ("feeder", "medium", "Feeder Imbalance Warning", "FDR-002 phase imbalance exceeding 15%"),
        ("forecast", "low", "Peak Demand Forecast", "Predicted 8% demand surge in next 4 hours"),
        ("anomaly", "high", "Anomaly Cluster Detected", "12 suspicious meters in sector 7-B"),
    ]
    for atype, sev, title, msg in alert_messages:
        alert = Alert(
            alert_type=atype,
            severity=sev,
            title=title,
            message=msg,
            source="AI Engine",
            is_read=False,
            is_resolved=False
        )
        db.add(alert)

    # Create inspections
    for meter in random.sample(meters, min(50, len(meters))):
        insp = Inspection(
            meter_id=meter.id,
            inspector_name=fake.name(),
            inspector_id=f"INS-{random.randint(100, 999)}",
            scheduled_date=datetime.utcnow() + timedelta(days=random.randint(-5, 10)),
            status=random.choice(["scheduled", "in_progress", "completed", "pending"]),
            priority=random.choice(["low", "medium", "high", "critical"]),
            inspection_type=random.choice(["routine", "anomaly_followup", "complaint", "audit"]),
            findings=fake.sentence() if random.random() > 0.5 else None,
            theft_confirmed=random.random() > 0.7,
            revenue_recovered_inr=random.uniform(0, 5000),
            latitude=meter.latitude,
            longitude=meter.longitude,
            district=meter.district
        )
        db.add(insp)

    # Create revenue reports
    for i in range(30):
        report_date = datetime.utcnow() - timedelta(days=i)
        for district in DISTRICTS[:5]:
            billed = random.uniform(5000000, 15000000)
            loss = random.uniform(500000, 2000000)
            revenue = RevenueReport(
                report_date=report_date,
                district=district,
                total_billed_inr=billed,
                total_collected_inr=billed - loss,
                revenue_loss_inr=loss,
                theft_loss_inr=loss * 0.7,
                technical_loss_inr=loss * 0.3,
                recovery_potential_inr=loss * 0.6,
                meters_count=random.randint(500, 2000),
                anomalous_meters_count=random.randint(20, 150)
            )
            db.add(revenue)

    # Create default user
    user = User(
        email="admin@smartgrid.ai",
        username="admin",
        full_name="Grid Administrator",
        hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
        role="admin",
        department="Grid Operations",
        is_superuser=True
    )
    db.add(user)

    db.commit()
    print(f"Database seeded: {len(meters)} meters, {len(transformers)} transformers")

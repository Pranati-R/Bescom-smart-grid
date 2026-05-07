from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(Integer, ForeignKey("smart_meters.id"))
    anomaly_type = Column(String(100), nullable=False)
    severity = Column(String(20), default="medium")
    confidence_score = Column(Float, default=0.8)
    anomaly_score = Column(Float, default=0.5)
    theft_probability = Column(Float, default=0.0)
    revenue_loss_inr = Column(Float, default=0.0)
    description = Column(Text)
    detected_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)
    is_resolved = Column(Boolean, default=False)
    resolution_notes = Column(Text)
    ai_explanation = Column(Text)
    features_json = Column(Text, default="{}")
    status = Column(String(20), default="open")
    created_at = Column(DateTime, default=datetime.utcnow)
    meter = relationship("SmartMeter", back_populates="anomalies")


class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)
    district = Column(String(100))
    forecast_date = Column(DateTime, nullable=False)
    horizon_hours = Column(Integer, default=24)
    predicted_demand_mw = Column(Float, nullable=False)
    lower_bound_mw = Column(Float)
    upper_bound_mw = Column(Float)
    confidence_level = Column(Float, default=0.95)
    weather_temperature = Column(Float)
    weather_humidity = Column(Float)
    model_version = Column(String(50), default="v1.0")
    created_at = Column(DateTime, default=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)
    title = Column(String(300), nullable=False)
    message = Column(Text, nullable=False)
    source = Column(String(100))
    source_id = Column(Integer)
    is_read = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)


class RevenueReport(Base):
    __tablename__ = "revenue_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_date = Column(DateTime, nullable=False)
    district = Column(String(100))
    total_billed_inr = Column(Float, default=0.0)
    total_collected_inr = Column(Float, default=0.0)
    revenue_loss_inr = Column(Float, default=0.0)
    theft_loss_inr = Column(Float, default=0.0)
    technical_loss_inr = Column(Float, default=0.0)
    recovery_potential_inr = Column(Float, default=0.0)
    meters_count = Column(Integer, default=0)
    anomalous_meters_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

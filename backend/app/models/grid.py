from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Substation(Base):
    __tablename__ = "substations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity_mva = Column(Float, default=100.0)
    current_load_mw = Column(Float, default=0.0)
    voltage_kv = Column(Float, default=33.0)
    status = Column(String(20), default="active")
    health_score = Column(Float, default=95.0)
    district = Column(String(100))
    city = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    feeders = relationship("Feeder", back_populates="substation")


class Feeder(Base):
    __tablename__ = "feeders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    substation_id = Column(Integer, ForeignKey("substations.id"))
    capacity_mw = Column(Float, default=10.0)
    current_load_mw = Column(Float, default=0.0)
    length_km = Column(Float, default=5.0)
    status = Column(String(20), default="active")
    health_score = Column(Float, default=90.0)
    overload_risk = Column(Float, default=0.1)
    created_at = Column(DateTime, default=datetime.utcnow)
    substation = relationship("Substation", back_populates="feeders")
    transformers = relationship("Transformer", back_populates="feeder")


class Transformer(Base):
    __tablename__ = "transformers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    feeder_id = Column(Integer, ForeignKey("feeders.id"))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity_kva = Column(Float, default=250.0)
    current_load_kw = Column(Float, default=0.0)
    voltage_primary = Column(Float, default=11.0)
    voltage_secondary = Column(Float, default=0.415)
    temperature_celsius = Column(Float, default=45.0)
    vibration_level = Column(Float, default=0.2)
    oil_level = Column(Float, default=95.0)
    health_score = Column(Float, default=85.0)
    overload_probability = Column(Float, default=0.15)
    failure_risk = Column(Float, default=0.05)
    status = Column(String(20), default="normal")
    last_maintenance = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    feeder = relationship("Feeder", back_populates="transformers")
    meters = relationship("SmartMeter", back_populates="transformer")


class SmartMeter(Base):
    __tablename__ = "smart_meters"

    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(String(20), unique=True, nullable=False)
    transformer_id = Column(Integer, ForeignKey("transformers.id"))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    consumer_name = Column(String(200))
    consumer_type = Column(String(50), default="residential")
    sanctioned_load_kw = Column(Float, default=5.0)
    current_consumption_kwh = Column(Float, default=0.0)
    monthly_consumption_kwh = Column(Float, default=0.0)
    expected_consumption_kwh = Column(Float, default=0.0)
    anomaly_score = Column(Float, default=0.0)
    theft_probability = Column(Float, default=0.0)
    revenue_loss_inr = Column(Float, default=0.0)
    billing_amount_inr = Column(Float, default=0.0)
    status = Column(String(20), default="active")
    is_suspicious = Column(Boolean, default=False)
    district = Column(String(100))
    address = Column(Text)
    phase = Column(String(10), default="3-phase")
    tariff_category = Column(String(50), default="LT-1")
    last_reading_date = Column(DateTime)
    installation_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    transformer = relationship("Transformer", back_populates="meters")
    anomalies = relationship("Anomaly", back_populates="meter")
    inspections = relationship("Inspection", back_populates="meter")

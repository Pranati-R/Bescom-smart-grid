from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(Integer, ForeignKey("smart_meters.id"))
    inspector_name = Column(String(200))
    inspector_id = Column(String(50))
    scheduled_date = Column(DateTime)
    completed_date = Column(DateTime)
    status = Column(String(50), default="scheduled")
    priority = Column(String(20), default="medium")
    inspection_type = Column(String(100), default="routine")
    findings = Column(Text)
    recommendation = Column(Text)
    theft_confirmed = Column(Boolean, default=False)
    revenue_recovered_inr = Column(Float, default=0.0)
    latitude = Column(Float)
    longitude = Column(Float)
    district = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    meter = relationship("SmartMeter", back_populates="inspections")
    evidence = relationship("InspectionEvidence", back_populates="inspection")


class InspectionEvidence(Base):
    __tablename__ = "inspection_evidence"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    file_name = Column(String(300))
    file_path = Column(String(500))
    file_type = Column(String(50))
    description = Column(Text)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    inspection = relationship("Inspection", back_populates="evidence")

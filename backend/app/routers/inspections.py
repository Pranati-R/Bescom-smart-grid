from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import random
from datetime import datetime

from ..database import get_db
from ..models.inspection import Inspection

router = APIRouter(prefix="/api/inspections", tags=["Inspections"])


class InspectionCreate(BaseModel):
    meter_id: int
    inspector_name: str
    inspector_id: str
    scheduled_date: str
    priority: str = "medium"
    inspection_type: str = "routine"
    notes: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@router.get("/")
async def get_inspections(
    page: int = 1,
    limit: int = 50,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    district: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Inspection)
    if status:
        query = query.filter(Inspection.status == status)
    if priority:
        query = query.filter(Inspection.priority == priority)
    if district:
        query = query.filter(Inspection.district == district)

    total = query.count()
    items = query.order_by(Inspection.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": [
            {
                "id": i.id,
                "meter_id": i.meter_id,
                "inspector_name": i.inspector_name,
                "inspector_id": i.inspector_id,
                "status": i.status,
                "priority": i.priority,
                "inspection_type": i.inspection_type,
                "scheduled_date": i.scheduled_date.isoformat() if i.scheduled_date else None,
                "completed_date": i.completed_date.isoformat() if i.completed_date else None,
                "theft_confirmed": i.theft_confirmed,
                "revenue_recovered_inr": i.revenue_recovered_inr,
                "district": i.district,
                "findings": i.findings,
                "lat": i.latitude,
                "lon": i.longitude,
            }
            for i in items
        ],
    }


@router.post("/")
async def create_inspection(data: InspectionCreate, db: Session = Depends(get_db)):
    insp = Inspection(
        meter_id=data.meter_id,
        inspector_name=data.inspector_name,
        inspector_id=data.inspector_id,
        scheduled_date=datetime.fromisoformat(data.scheduled_date),
        priority=data.priority,
        inspection_type=data.inspection_type,
        notes=data.notes,
        district=data.district,
        latitude=data.latitude,
        longitude=data.longitude,
        status="scheduled",
    )
    db.add(insp)
    db.commit()
    db.refresh(insp)
    return {"id": insp.id, "status": "created"}


@router.put("/{inspection_id}/status")
async def update_inspection_status(
    inspection_id: int,
    status: str,
    findings: Optional[str] = None,
    theft_confirmed: bool = False,
    revenue_recovered: float = 0.0,
    db: Session = Depends(get_db),
):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found")
    insp.status = status
    if findings:
        insp.findings = findings
    if status == "completed":
        insp.completed_date = datetime.utcnow()
        insp.theft_confirmed = theft_confirmed
        insp.revenue_recovered_inr = revenue_recovered
    db.commit()
    return {"status": "updated"}


@router.get("/stats")
async def get_inspection_stats(db: Session = Depends(get_db)):
    total = db.query(Inspection).count()
    completed = db.query(Inspection).filter(Inspection.status == "completed").count()
    theft_confirmed = db.query(Inspection).filter(Inspection.theft_confirmed == True).count()
    recovered = db.query(Inspection).all()
    total_recovered = sum(i.revenue_recovered_inr for i in recovered)
    return {
        "total": total,
        "scheduled": db.query(Inspection).filter(Inspection.status == "scheduled").count(),
        "in_progress": db.query(Inspection).filter(Inspection.status == "in_progress").count(),
        "completed": completed,
        "theft_confirmed": theft_confirmed,
        "detection_rate": round(theft_confirmed / max(completed, 1) * 100, 1),
        "total_recovered_inr": round(total_recovered, 0),
        "avg_recovery_inr": round(total_recovered / max(completed, 1), 0),
    }

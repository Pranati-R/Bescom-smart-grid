from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import random

router = APIRouter(prefix="/api/copilot", tags=["AI Copilot"])

RESPONSES = {
    "theft": "🔍 **Theft Analysis**: Detected {count} high-risk meters across {districts}. Top clusters in Kukatpally (34 meters, ₹2.1L loss), HITEC City (28 meters, ₹1.8L loss). Coordinated theft pattern detected. Recommend immediate inspection deployment.",
    "overload": "⚡ **Overload Alert**: {count} transformers operating above 80% capacity. Critical: TXR-045 at 127% (Madhapur), TXR-023 at 118% (Gachibowli). Predicted cascade failure risk: 23% in next 6 hours. Suggest load redistribution.",
    "forecast": "📊 **Demand Forecast**: Peak demand of {peak} MW predicted at 8:30 PM tonight. Weather impact: +8% due to 41°C forecast. High-risk zones: Industrial corridor (Patancheru), Residential cluster (Kukatpally). Confidence: 94.2%.",
    "revenue": "💰 **Revenue Analysis**: Monthly loss of ₹{loss}L detected. Theft contribution: 71% (₹{theft}L), Technical: 29% (₹{tech}L). Recovery potential: ₹{recovery}L with 65% inspection success rate. ROI on inspection: 4.2x.",
    "summary": "🧠 **Grid Summary**: System operating at {health}% health. {anomalies} active anomalies, {transformers} transformers at risk, ₹{loss}L revenue at risk. AI confidence: 94.7%. Recommend prioritizing Kukatpally and HITEC City zones.",
}


class CopilotQuery(BaseModel):
    query: str
    context: Optional[dict] = None


class CopilotResponse(BaseModel):
    query: str
    response: str
    data: Optional[dict] = None
    actions: Optional[List[dict]] = None
    confidence: float


def detect_intent(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ["theft", "steal", "suspicious", "anomal"]):
        return "theft"
    elif any(w in q for w in ["overload", "transformer", "capacity", "critical"]):
        return "overload"
    elif any(w in q for w in ["forecast", "predict", "demand", "peak"]):
        return "forecast"
    elif any(w in q for w in ["revenue", "loss", "money", "recover"]):
        return "revenue"
    else:
        return "summary"


@router.post("/query", response_model=CopilotResponse)
async def query_copilot(req: CopilotQuery):
    intent = detect_intent(req.query)
    template = RESPONSES.get(intent, RESPONSES["summary"])

    response = template.format(
        count=random.randint(15, 45),
        districts=random.randint(3, 6),
        peak=round(random.uniform(950, 1100), 1),
        loss=round(random.uniform(85, 120), 1),
        theft=round(random.uniform(60, 85), 1),
        tech=round(random.uniform(25, 35), 1),
        recovery=round(random.uniform(55, 78), 1),
        health=round(random.uniform(82, 96), 1),
        anomalies=random.randint(45, 95),
        transformers=random.randint(5, 18),
    )

    actions = [
        {"label": "View on Map", "action": "navigate", "target": "/map"},
        {"label": "Generate Report", "action": "report", "target": "pdf"},
        {"label": "Assign Inspections", "action": "navigate", "target": "/inspections"},
    ]

    return CopilotResponse(
        query=req.query,
        response=response,
        data={"intent": intent, "entities_found": random.randint(5, 50)},
        actions=actions,
        confidence=round(random.uniform(0.87, 0.97), 3),
    )


@router.get("/suggestions")
async def get_suggestions():
    return [
        "Show highest theft zones this month",
        "Predict overload risk for next 6 hours",
        "Display suspicious meters in HITEC City",
        "Summarize revenue loss by district",
        "Which transformers need urgent maintenance?",
        "Forecast peak demand for tonight",
        "Show coordinated theft patterns",
        "What is the AI confidence score today?",
    ]

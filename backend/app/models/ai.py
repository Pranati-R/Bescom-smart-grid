from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from datetime import datetime
from ..database import Base


class AIExplanation(Base):
    __tablename__ = "ai_explanations"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    model_name = Column(String(100))
    model_version = Column(String(50))
    prediction = Column(String(200))
    confidence = Column(Float)
    explanation_type = Column(String(50), default="shap")
    features_json = Column(Text, default="{}")
    shap_values_json = Column(Text, default="{}")
    reasoning = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

import asyncio
import json
import random
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..utils.mock_data import generate_realtime_metrics, generate_stream_events

router = APIRouter(tags=["WebSocket"])

connected_clients = []


@router.websocket("/ws/metrics")
async def websocket_metrics(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            data = generate_realtime_metrics()
            await websocket.send_json(data)
            await asyncio.sleep(3)
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
    except Exception:
        if websocket in connected_clients:
            connected_clients.remove(websocket)


@router.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            event = generate_stream_events()
            await websocket.send_json(event)
            await asyncio.sleep(random.uniform(1.5, 4.0))
    except WebSocketDisconnect:
        pass
    except Exception:
        pass


@router.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            alert_types = ["overload", "theft", "anomaly", "forecast", "maintenance"]
            severities = ["critical", "high", "medium", "low"]
            alert = {
                "id": random.randint(1000, 9999),
                "type": random.choice(alert_types),
                "severity": random.choice(severities),
                "message": f"AI Alert: {random.choice(['Transformer overload detected', 'Theft pattern confirmed', 'Demand spike incoming', 'Feeder fault detected'])}",
                "timestamp": datetime.utcnow().isoformat(),
            }
            await websocket.send_json(alert)
            await asyncio.sleep(random.uniform(5.0, 15.0))
    except WebSocketDisconnect:
        pass
    except Exception:
        pass

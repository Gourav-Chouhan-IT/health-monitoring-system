from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from collections import deque
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

buffer = deque(maxlen=30)
clients = []

class SensorData(BaseModel):
    bpm: float
    temp: float
    spo2: float
    gsr: float
    timestamp: int

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/history")
def get_history():
    return list(buffer)

@app.post("/data")
async def receive_data(data: SensorData):
    buffer.append(data.dict())
    for client in clients:
        await client.send_json(data.dict())
    return {"status": "received"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        clients.remove(websocket)
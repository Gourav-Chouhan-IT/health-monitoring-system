# 🏥 Health Monitoring System

A real-time health monitoring dashboard that streams live sensor data from Arduino to a React frontend via a FastAPI WebSocket backend.

> **Status:** Phase 1 Complete — Live dashboard with WebSocket streaming  
> **Phase 2 (In Progress):** MongoDB storage + JWT authentication  

---

## 📸 Dashboard Preview

> Heart Rate · Body Temperature · Blood Oxygen (SpO₂) · Activity Level — all updating live in the browser.

---

## 🏗️ Architecture

```
Arduino (ESP32) ──► bridge.py ──► FastAPI Backend ──► React Frontend
   [Sensors]        [Serial/Mock]   [WebSocket + REST]   [Live Dashboard]
```

**Sensors:** Heart Rate (BPM) · Body Temperature (°C) · Blood Oxygen (SpO₂) · GSR  
**Communication:** Serial (live) / Mock data generator (dev mode)  
**Streaming:** WebSocket for real-time updates, REST for history

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS, Recharts |
| Backend | Python, FastAPI, WebSocket |
| Bridge | Python (Serial / Mock mode) |
| Hardware | Arduino / ESP32, health sensors |
| Auth (Phase 2) | JWT Authentication |
| Database (Phase 2) | MongoDB |

---

## 📁 Project Structure

```
health-monitoring-system/
├── arduino/          # Arduino/ESP32 sensor code
├── backend/          # FastAPI server (main.py)
├── bridge/           # Python data bridge (bridge.py)
├── frontend/         # React.js dashboard
└── README.md
```

---

## ⚙️ Setup & Running

### 1. Backend

```bash
cd backend
pip install fastapi uvicorn
uvicorn main:app --reload --port 8000
```

### 2. Bridge (Mock Mode — no hardware needed)

```bash
cd bridge
pip install requests
python bridge.py
```

> To use live ESP32 data, change `MODE = "mock"` to `MODE = "live"` in `bridge.py` and connect your Arduino via serial.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📊 Dashboard Features

- **Heart Rate** — Live BPM with area chart history
- **Activity Level** — Auto-detected from BPM (Resting / Active / Exercising)
- **Body Temperature** — Real-time °C with fever/hypothermia alerts
- **Blood Oxygen (SpO₂)** — Live % with low oxygen warning and progress bar
- **WebSocket streaming** — All values update every second

### Health Thresholds

| Metric | Normal Range | Alert |
|--------|-------------|-------|
| Heart Rate | 60–100 BPM | Active > 70, Exercising > 100 |
| Body Temp | 36.1°C – 37.2°C | Fever > 37.2°C, Hypothermia < 36.1°C |
| SpO₂ | ≥ 95% | Warning below 95% |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/` | Health check |
| GET | `/history` | Last 30 sensor readings |
| POST | `/data` | Receive data from bridge |
| WS | `/ws` | WebSocket live stream |

---

## 🗺️ Roadmap

- [x] FastAPI backend with WebSocket streaming
- [x] Python data bridge (mock + serial modes)
- [x] React dashboard with live charts and health alerts
- [x] Arduino sensor integration code
- [ ] MongoDB — persistent data storage
- [ ] JWT authentication — user accounts and data isolation
- [ ] Deploy to cloud (Render / Railway)

---

## 👤 Author

**Gourav Chouhan**  
B.Tech Information Technology, VIT Bhopal  
[GitHub](https://github.com/Gourav-Chouhan-IT) · [LinkedIn](https://www.linkedin.com/in/gourav-chouhan-071036374)

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

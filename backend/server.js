/*
 * StressWatch — Backend
 * =====================
 * Single source of truth for stress calculation.
 *
 * Architecture
 *   Arduino  → raw sensor JSON
 *   bridge.py → validates + forwards raw values via POST /api/data
 *   server.js → calculates stressLevel, emits to frontend via Socket.IO
 *   frontend  → displays the backend-provided stressLevel (no local calc)
 *
 * POST /api/data  — receive raw readings from bridge.py
 * POST /api/control — switch demo override mode (NORMAL | STRESS | ACTIVE)
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

require('dotenv').config();
const mongoose = require('mongoose');
const Reading = require('./models/Reading');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// ── Demo override state ─────────────────────────────────────────
// "NORMAL" means use real sensor data as-is.
// "STRESS" / "ACTIVE" replace sensor values with demo values for 15 s.
let forcedMode = 'NORMAL';

// ── Stress algorithm — ONLY place stress is calculated ──────────
/**
 * Returns "Low" | "Medium" | "High" based on heart rate and GSR.
 * @param {number} hr  - heart rate in BPM
 * @param {number} gsr - galvanic skin response (sweat level)
 * @param {number} spo2 - oxygen saturation level
 * @param {number} temperature - body temperature
 * @param {string} motion - motion state ("Active" or "Inactive")
 * @returns {string} stress level
 */
const calculateStress = (hr, gsr, spo2, temperature, motion) => {

  // 1. HEART RATE SCORE (0-100)
  // Normal resting HR is 60-80. Higher = more stress.
  let hrScore = 0;
  if (hr < 60)       hrScore = 20;   // too low, slight concern
  else if (hr < 80)  hrScore = 0;    // normal
  else if (hr < 95)  hrScore = 30;   // slightly elevated
  else if (hr < 110) hrScore = 60;   // elevated
  else if (hr < 130) hrScore = 85;   // high
  else               hrScore = 100;  // very high

  // 2. GSR SCORE (0-100)
  // Higher GSR raw value = more skin conductance = more stress
  let gsrScore = 0;
  if (gsr < 200)      gsrScore = 0;   // calm
  else if (gsr < 400) gsrScore = 25;
  else if (gsr < 600) gsrScore = 50;
  else if (gsr < 800) gsrScore = 75;
  else                gsrScore = 100; // very stressed

  // 3. SPO2 SCORE (0-100)
  // Low oxygen = physiological stress
  let spo2Score = 0;
  if (spo2 >= 97)      spo2Score = 0;   // normal
  else if (spo2 >= 94) spo2Score = 20;
  else if (spo2 >= 90) spo2Score = 50;
  else                 spo2Score = 100; // critical

  // 4. TEMPERATURE SCORE (0-100)
  // Fever or hypothermia = stress on body
  let tempScore = 0;
  if (temperature >= 36.1 && temperature <= 37.2) tempScore = 0;  // normal
  else if (temperature > 37.2 && temperature <= 38.0) tempScore = 30;
  else if (temperature > 38.0) tempScore = 70;  // fever
  else tempScore = 20;  // below normal

  // 5. MOTION BONUS
  // If actively moving, HR elevation is expected — reduce stress weight
  const motionMultiplier = motion === 'Active' ? 0.7 : 1.0;

  // 6. WEIGHTED FINAL SCORE
  const rawScore = (
    hrScore  * 0.40 +   // HR is most important
    gsrScore * 0.35 +   // GSR is second most important
    spo2Score * 0.15 +  // SpO2 matters but usually stays normal
    tempScore * 0.10    // Temperature changes slowly
  );

  const finalScore = Math.round(rawScore * motionMultiplier);

  // 7. LABEL
  let stressLevel;
  if (finalScore >= 70)      stressLevel = 'High';
  else if (finalScore >= 40) stressLevel = 'Medium';
  else                       stressLevel = 'Low';

  return { stressLevel, stressScore: finalScore, hrScore, gsrScore, spo2Score, tempScore };
};

const parseReadingLimit = (value) => {
    const limit = Number.parseInt(value, 10);
    if (!Number.isFinite(limit)) return 100;
    return Math.min(Math.max(limit, 1), 1000);
};

// ── POST /api/control ───────────────────────────────────────────
app.post('/api/control', (req, res) => {
    const { mode } = req.body;
    if (!['NORMAL', 'STRESS', 'ACTIVE'].includes(mode)) {
        return res.status(400).json({ status: 'error', message: 'Invalid mode' });
    }

    forcedMode = mode;
    console.log(`[CTRL] Demo mode → ${mode}`);

    // Auto-reset to NORMAL after 15 s so a demo doesn't run forever
    if (mode !== 'NORMAL') {
        setTimeout(() => {
            forcedMode = 'NORMAL';
            console.log('[CTRL] Demo mode auto-reset → NORMAL');
        }, 15_000);
    }

    res.json({ status: 'success', mode });
});

// ── GET /api/readings ───────────────────────────────────────────
app.get('/api/readings', async (req, res) => {
    const limit = parseReadingLimit(req.query.limit);

    try {
        const readings = await Reading
            .find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .select('-__v')
            .lean();

        res.json({
            status: 'success',
            count: readings.length,
            readings: readings.reverse(),
        });
    } catch (err) {
        console.error('[ERROR] Failed to fetch readings:', err.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch readings',
        });
    }
});

// ── POST /api/data ──────────────────────────────────────────────
app.post('/api/data', (req, res) => {
    // 1. Extract and coerce incoming raw sensor values
    let {
        heartRate,
        spo2,
        gsr,
        temperature,
        motion,
        isHardware,
    } = req.body;

    heartRate = Number(heartRate);
    gsr = Number(gsr);
    temperature = Number(temperature);
    const spo2Num = Number(spo2);

    // Safe fallbacks if a value is non-finite (e.g. missing field)
    let safeHR = Number.isFinite(heartRate) ? heartRate : 0;
    let safeGSR = Number.isFinite(gsr) ? gsr : 0;
    let safeTemp = Number.isFinite(temperature) ? temperature : 0;
    let safeSpo2 = Number.isFinite(spo2Num) ? spo2Num : 98;

    // 2. Apply demo overrides (replaces sensor values entirely)
    if (forcedMode === 'STRESS') {
        // Elevated HR + low GSR (sweaty/tense) → should trigger "High"
        safeHR = Math.floor(Math.random() * 30) + 120;  // 120–149 BPM
        safeGSR = Math.floor(Math.random() * 100) + 100; // 100–199 (low = sweaty)
        motion = 'Inactive';
    } else if (forcedMode === 'ACTIVE') {
        // Moderate HR + high GSR (moving but not stressed)
        safeHR = Math.floor(Math.random() * 20) + 90;   // 90–109 BPM
        safeGSR = 500;
        motion = 'Active';
    }

    // 3. Calculate stress on the backend — always, no exceptions. This ensures the frontend is a pure display layer with no hidden logic.
    const stress = calculateStress(safeHR, safeGSR, safeSpo2, safeTemp, motion);

    // 4. Save a database-friendly packet with a real Date timestamp
    const dataPacket = {
        heartRate: safeHR,
        spo2: safeSpo2,
        temperature: safeTemp,
        gsr: safeGSR,        // post-override value, consistent with stressLevel
        stressLevel: stress.stressLevel,
        stressScore: stress.stressScore,
        hrScore: stress.hrScore,
        gsrScore: stress.gsrScore,
        spo2Score: stress.spo2Score,
        tempScore: stress.tempScore,
        motion,
        isHardware,
        timestamp: new Date(),
    };

    Reading.create(dataPacket).catch((err) => {
        console.error('[WARN] Failed to save reading:', err.message);
    });

    // 5. Emit a UI-friendly packet. The frontend expects timestamp as text.
    io.emit('new-reading', {
        ...dataPacket,
        timestamp: dataPacket.timestamp.toLocaleTimeString(),
    });
    console.log(
        `[DATA] HR=${safeHR} GSR=${safeGSR} Stress=${stress.stressLevel}` +
        (forcedMode !== 'NORMAL' ? ` (override: ${forcedMode})` : '')
    );

    res.json({ status: 'success' });
});

// ── Start ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('[OK] MongoDB connected');

        server.listen(PORT, () => {
            console.log(`[OK] Backend running at http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('[ERROR] MongoDB connection failed:', err.message);
        process.exit(1);
    });

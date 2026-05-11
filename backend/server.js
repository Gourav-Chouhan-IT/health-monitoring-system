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
const cors    = require('cors');
const http    = require('http');
const { Server } = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

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
 * @param {number} gsr - raw GSR ADC value (higher = more resistance = calmer)
 */
const calculateStress = (hr, gsr) => {
    if (hr > 115 && gsr < 250) return 'High';
    if (hr > 95)               return 'Medium';
    return 'Low';
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

    heartRate   = Number(heartRate);
    gsr         = Number(gsr);
    temperature = Number(temperature);
    const spo2Num = Number(spo2);

    // Safe fallbacks if a value is non-finite (e.g. missing field)
    let safeHR   = Number.isFinite(heartRate)  ? heartRate  : 0;
    let safeGSR  = Number.isFinite(gsr)        ? gsr        : 0;
    let safeTemp = Number.isFinite(temperature) ? temperature : 0;
    let safeSpo2 = Number.isFinite(spo2Num)    ? spo2Num   : 98;

    // 2. Apply demo overrides (replaces sensor values entirely)
    if (forcedMode === 'STRESS') {
        // Elevated HR + low GSR (sweaty/tense) → should trigger "High"
        safeHR  = Math.floor(Math.random() * 30) + 120;  // 120–149 BPM
        safeGSR = Math.floor(Math.random() * 100) + 100; // 100–199 (low = sweaty)
        motion  = 'Inactive';
    } else if (forcedMode === 'ACTIVE') {
        // Moderate HR + high GSR (moving but not stressed)
        safeHR  = Math.floor(Math.random() * 20) + 90;   // 90–109 BPM
        safeGSR = 500;
        motion  = 'Active';
    }

    // 3. Calculate stress on the backend — always, no exceptions.
    //    The bridge never sends a stressLevel; we never accept one from outside.
    const stressLevel = calculateStress(safeHR, safeGSR);

    // 4. Emit full data packet to all connected frontend clients
    const dataPacket = {
        heartRate:   safeHR,
        spo2:        safeSpo2,
        temperature: safeTemp,
        gsr:         safeGSR,        // post-override value, consistent with stressLevel
        stressLevel,                  // calculated here, displayed by frontend
        motion,
        isHardware,
        timestamp: new Date().toLocaleTimeString(),
    };

    io.emit('new-reading', dataPacket);
    console.log(
        `[DATA] HR=${safeHR} GSR=${safeGSR} Stress=${stressLevel}` +
        (forcedMode !== 'NORMAL' ? ` (override: ${forcedMode})` : '')
    );

    res.json({ status: 'success' });
});

// ── Start ───────────────────────────────────────────────────────
server.listen(5000, () => {
    console.log('[OK]  Backend running at http://localhost:5000');
});


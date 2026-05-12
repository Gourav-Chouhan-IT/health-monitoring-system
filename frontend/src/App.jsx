/* ═══════════════════════════════════════════
   StressWatch — frontend app.js

   Architecture contract:
   ─ This file is DISPLAY ONLY.
   ─ stressLevel is provided by the backend and rendered here.
   ─ There is NO local stress calculation in this file.
   ─ Demo controls call POST /api/control on the backend;
     the backend applies overrides and recalculates stress.

   Data flow:
   Arduino → bridge.py → backend → Socket.IO "new-reading" → here
═══════════════════════════════════════════ */

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import Header from './components/Header';
import ModeBanner from './components/ModeBanner';
import StressHero from './components/StressHero';
import MetricCards from './components/MetricCards';
import StressBreakdown from './components/StressBreakdown';
import StressHistoryChart from './components/StressHistoryChart';
import SensorChart from './components/SensorChart';
import DemoControl from './components/DemoControl';
import Toast from './components/Toast';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const MAX_HISTORY = 30;

const roundedNumber = (value, decimals = 0) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Number(number.toFixed(decimals));
};

const stressScoreFromLevel = (level) => {
  if (level === 'High') return 85;
  if (level === 'Medium') return 55;
  return 20;
};

export default function App() {
  const [connected, setConnected] = useState(false);
  const [reading, setReading] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [readingCount, setReadingCount] = useState(0);
  const [toast, setToast] = useState('');
  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), 2800);
  }, []);

  // Load historical readings on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${BACKEND}/api/readings?limit=${MAX_HISTORY}`);
        const data = await response.json();
        if (data.status === 'success' && data.readings) {
          const history = data.readings.map((reading) => ({
            time: new Date(reading.timestamp).toLocaleTimeString(),
            heartRate: roundedNumber(reading.heartRate),
            spo2: roundedNumber(reading.spo2),
            temperature: roundedNumber(reading.temperature, 1),
            stressLevel: reading.stressLevel || 'Low',
            stressScore: Number.isFinite(Number(reading.stressScore))
              ? roundedNumber(reading.stressScore)
              : stressScoreFromLevel(reading.stressLevel),
          }));
          setSensorHistory(history);
        }
      } catch (err) {
        console.warn('Failed to load history:', err.message);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    const socket = io(BACKEND, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      setConnected(true);
      showToast('Connected to server');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      showToast('Disconnected — reconnecting…');
    });

    socket.on('new-reading', (data) => {
      setReading(data);
      setReadingCount((c) => c + 1);
      setSensorHistory((prev) => {
        const entry = {
          time: data.timestamp,
          heartRate: roundedNumber(data.heartRate),
          spo2: roundedNumber(data.spo2),
          temperature: roundedNumber(data.temperature, 1),
          stressLevel: data.stressLevel || 'Low',
          stressScore: Number.isFinite(Number(data.stressScore))
            ? roundedNumber(data.stressScore)
            : stressScoreFromLevel(data.stressLevel),
        };
        const next = [...prev, entry];
        return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
      });
    });

    return () => {
      socket.disconnect();
      clearTimeout(toastTimerRef.current);
    };
  }, [showToast]);

  return (
    <>
      <Header connected={connected} isHardware={reading?.isHardware} />
      <main className="main">
        <ModeBanner isHardware={reading?.isHardware} connected={connected} />
        <StressHero
          stressLevel={reading?.stressLevel}
          stressScore={reading?.stressScore}
          motion={reading?.motion}
          timestamp={reading?.timestamp}
        />
        <MetricCards
          heartRate={reading?.heartRate}
          spo2={reading?.spo2}
          temperature={reading?.temperature}
          gsr={reading?.gsr}
          stressLevel={reading?.stressLevel}
          readingCount={readingCount}
        />
        
        <SensorChart
          data={sensorHistory}
          label="Heart Rate"
          dataKey="heartRate"
          unit="bpm"
          color="#c26252"
          domain={[50, 140]}
        />
        <SensorChart
          data={sensorHistory}
          label="SpO2"
          dataKey="spo2"
          unit="%"
          color="#5C766D"
          domain={[85, 100]}
        />
        <SensorChart
          data={sensorHistory}
          label="Temperature"
          dataKey="temperature"
          unit="C"
          color="#C9996B"
          domain={[35, 40]}
        />
        <StressHistoryChart data={sensorHistory} />
        <StressBreakdown reading={reading} />
        <DemoControl showToast={showToast} />
      </main>
      <Toast message={toast} />
    </>
  );
}

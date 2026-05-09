import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import Header from './components/Header';
import ModeBanner from './components/ModeBanner';
import StressHero from './components/StressHero';
import MetricCards from './components/MetricCards';
import HeartRateChart from './components/HeartRateChart';
import DemoControl from './components/DemoControl';
import Toast from './components/Toast';

const BACKEND = 'http://localhost:5000';
const MAX_HISTORY = 30;

export default function App() {
  const [connected, setConnected] = useState(false);
  const [reading, setReading] = useState(null);
  const [hrHistory, setHrHistory] = useState([]);
  const [readingCount, setReadingCount] = useState(0);
  const [toast, setToast] = useState('');
  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), 2800);
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
      setHrHistory((prev) => {
        const entry = { time: data.timestamp, hr: Math.round(data.heartRate) || 0 };
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
          motion={reading?.motion}
          timestamp={reading?.timestamp}
        />
        <MetricCards
          heartRate={reading?.heartRate}
          spo2={reading?.spo2}
          temperature={reading?.temperature}
          stressLevel={reading?.stressLevel}
          readingCount={readingCount}
        />
        <HeartRateChart hrHistory={hrHistory} />
        <DemoControl showToast={showToast} />
      </main>
      <Toast message={toast} />
    </>
  );
}

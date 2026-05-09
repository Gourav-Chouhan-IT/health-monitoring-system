import { useState, useRef } from 'react';

const BACKEND = 'http://localhost:5000';

export default function DemoControl({ showToast }) {
  const [activeMode, setActiveMode] = useState('NORMAL');
  const [feedback, setFeedback] = useState('');
  const timerRef = useRef(null);

  async function setMode(mode) {
    try {
      await fetch(`${BACKEND}/api/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      setActiveMode(mode);

      const labels = {
        NORMAL: 'Normal mode active',
        STRESS: 'High stress simulation — resets in 15 s',
        ACTIVE: 'Active/exercise simulation — resets in 15 s',
      };
      setFeedback(labels[mode] || '');

      if (mode !== 'NORMAL') {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setActiveMode('NORMAL');
          setFeedback('Reset to normal mode');
        }, 15000);
      }

      showToast(`Mode: ${mode}`);
    } catch {
      showToast('Could not reach server');
    }
  }

  const btnClass = (m) => `ctrl-btn${activeMode === m ? ' ctrl-btn--active' : ''}`;

  return (
    <section className="control-section card">
      <div className="control-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
        </svg>
        <span className="card-title">Demo Control</span>
        <span className="control-hint">Override resets after 15 s</span>
      </div>
      <div className="control-buttons">
        <button className={btnClass('NORMAL')} onClick={() => setMode('NORMAL')}>
          <span className="ctrl-icon">🟢</span> Normal
        </button>
        <button className={btnClass('STRESS')} onClick={() => setMode('STRESS')}>
          <span className="ctrl-icon">🔴</span> High Stress
        </button>
        <button className={btnClass('ACTIVE')} onClick={() => setMode('ACTIVE')}>
          <span className="ctrl-icon">🟡</span> Active / Exercise
        </button>
      </div>
      <p className="mode-feedback">{feedback}</p>
    </section>
  );
}

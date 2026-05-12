import { useEffect, useRef } from 'react';

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

function BeatDot({ readingCount }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !readingCount) return;
    ref.current.classList.remove('beating');
    void ref.current.offsetWidth; // force reflow to restart animation
    ref.current.classList.add('beating');
  }, [readingCount]);

  return <div ref={ref} className="beat-dot" />;
}

export default function MetricCards({ heartRate, spo2, temperature, gsr, stressLevel, readingCount }) {
  const hr   = heartRate   != null ? Math.round(heartRate) : null;
  const sp   = spo2        != null ? Math.round(spo2) : null;
  const temp = temperature != null ? Number(temperature).toFixed(1) : null;
  const gsrValue = gsr != null ? Math.round(gsr) : null;

  const hrColor =
    stressLevel === 'High'   ? 'var(--stress-high)'
    : stressLevel === 'Medium' ? 'var(--caramel)'
    : 'var(--text)';

  const hrBarW   = hr   != null ? `${clamp((hr / 180) * 100, 0, 100)}%` : '0%';
  const spo2BarW = sp   != null ? `${clamp(((sp - 90) / 10) * 100, 0, 100)}%` : '0%';
  const tempBarW = temp != null ? `${clamp(((parseFloat(temp) - 35) / 5) * 100, 0, 100)}%` : '0%';
  const gsrBarW = gsrValue != null ? `${clamp((gsrValue / 600) * 100, 0, 100)}%` : '0%';

  return (
    <section className="cards-grid">

      <div className="card card--hr">
        <div className="card-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <div className="card-body">
          <span className="card-title">Heart Rate</span>
          <div className="card-value-row">
            <span className="card-value" style={{ color: hrColor }}>{hr ?? '-'}</span>
            <span className="card-unit">bpm</span>
          </div>
          <div className="mini-bar-wrap">
            <div className="mini-bar" style={{ width: hrBarW }} />
          </div>
        </div>
        <BeatDot readingCount={readingCount} />
      </div>

      <div className="card card--spo2">
        <div className="card-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C6 2 2 7 2 12s4 10 10 10 10-4.5 10-10S18 2 12 2z" />
            <path d="M8 12h8M12 8v8" />
          </svg>
        </div>
        <div className="card-body">
          <span className="card-title">SpO₂</span>
          <div className="card-value-row">
            <span className="card-value">{sp ?? '-'}</span>
            <span className="card-unit">%</span>
          </div>
          <div className="mini-bar-wrap">
            <div className="mini-bar" style={{ width: spo2BarW }} />
          </div>
        </div>
      </div>

      <div className="card card--temp">
        <div className="card-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
          </svg>
        </div>
        <div className="card-body">
          <span className="card-title">Temperature</span>
          <div className="card-value-row">
            <span className="card-value">{temp ?? '-'}</span>
            <span className="card-unit">°C</span>
          </div>
          <div className="mini-bar-wrap">
            <div className="mini-bar" style={{ width: tempBarW }} />
          </div>
        </div>
      </div>

      <div className="card card--gsr">
        <div className="card-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20" />
            <path d="M7 7c0-2.2 2.2-4 5-4s5 1.8 5 4-2.2 4-5 4-5 1.8-5 4 2.2 4 5 4 5-1.8 5-4" />
          </svg>
        </div>
        <div className="card-body">
          <span className="card-title">GSR</span>
          <div className="card-value-row">
            <span className="card-value">{gsrValue ?? '-'}</span>
            <span className="card-unit">ADC</span>
          </div>
          <div className="mini-bar-wrap">
            <div className="mini-bar" style={{ width: gsrBarW }} />
          </div>
        </div>
      </div>

    </section>
  );
}

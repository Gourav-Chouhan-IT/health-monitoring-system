/**
 * StressBreakdown — pure display component.
 * All scores come directly from the backend (server.js calculateStress).
 * Zero recalculation on the frontend.
 *
 * Backend weights:  HR 40%  |  GSR 35%  |  SpO₂ 15%  |  Temp 10%
 * Motion modifier:  ×0.7 when Active  |  ×1.0 when Inactive
 */

const scoreToLevel = (s) => {
  if (s >= 70) return ['High',   'breakdown-badge--high'];
  if (s >= 40) return ['Medium', 'breakdown-badge--medium'];
  return           ['Low',    'breakdown-badge--low'];
};

const overallColor = (level) => {
  if (level === 'High')   return 'var(--stress-high)';
  if (level === 'Medium') return 'var(--caramel)';
  return 'var(--sage)';
};

const icons = {
  hr: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  gsr: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20" />
      <path d="M7 7c0-2.2 2.2-4 5-4s5 1.8 5 4-2.2 4-5 4-5 1.8-5 4 2.2 4 5 4 5-1.8 5-4" />
    </svg>
  ),
  spo2: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C6 2 2 7 2 12s4 10 10 10 10-4.5 10-10S18 2 12 2z" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  ),
  temp: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  ),
};

function MetricRow({ id, label, rawValue, unit, score, weight, color }) {
  if (score == null) return null;
  const [lvlText, lvlCls] = scoreToLevel(score);

  return (
    <div className="breakdown-row">
      <div className="breakdown-metric">
        <span className="breakdown-metric-icon" style={{ color }}>{icons[id]}</span>
        <span>{label}</span>
        <span className="breakdown-metric-raw">{rawValue} {unit}</span>
        <span className="breakdown-weight-pill">×{weight}%</span>
      </div>
      <div className="breakdown-bar-wrap">
        <div className="breakdown-bar" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="breakdown-score-num">{score}</span>
      <span className={`breakdown-badge ${lvlCls}`}>{lvlText}</span>
    </div>
  );
}

export default function StressBreakdown({ reading }) {
  if (!reading) {
    return (
      <section className="breakdown-section card">
        <div className="breakdown-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="card-title">Score Breakdown</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Waiting for data…</p>
      </section>
    );
  }

  const {
    heartRate, gsr, spo2, temperature, motion,
    hrScore, gsrScore, spo2Score, tempScore,
    stressScore, stressLevel,
  } = reading;

  const isActive = motion === 'Active';

  const rows = [
    { id: 'hr',   label: 'Heart Rate',      rawValue: Math.round(heartRate ?? 0), unit: 'bpm', score: hrScore,   weight: 40, color: 'var(--accent-hr)'   },
    { id: 'gsr',  label: 'Skin Resistance',  rawValue: Math.round(gsr ?? 0),       unit: 'ADC', score: gsrScore,  weight: 35, color: 'var(--accent-gsr)'  },
    { id: 'spo2', label: 'Blood Oxygen',     rawValue: Math.round(spo2 ?? 0),      unit: '%',   score: spo2Score, weight: 15, color: 'var(--accent-spo2)' },
    { id: 'temp', label: 'Temperature',      rawValue: Number(temperature ?? 0).toFixed(1), unit: '°C', score: tempScore, weight: 10, color: 'var(--accent-temp)' },
  ];

  return (
    <section className="breakdown-section card">
      <div className="breakdown-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span className="card-title">Score Breakdown</span>
      </div>

      <div className="breakdown-rows">
        {rows.map(r => <MetricRow key={r.id} {...r} />)}

        {/* Motion multiplier notice */}
        {isActive && (
          <div className="breakdown-motion-note">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Motion active — final score reduced by 30% (×0.7 multiplier applied)
          </div>
        )}

        <div className="breakdown-divider" />

        {/* Overall */}
        <div className="breakdown-overall">
          <span className="breakdown-overall-label">Overall</span>
          <div className="breakdown-overall-bar-wrap">
            <div
              className="breakdown-overall-bar"
              style={{
                width: stressScore != null ? `${stressScore}%` : '0%',
                background: overallColor(stressLevel),
              }}
            />
          </div>
          <span className="breakdown-overall-val" style={{ color: overallColor(stressLevel) }}>
            {stressScore != null ? Math.round(stressScore) : '—'}
            <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '.78rem' }}> / 100</span>
          </span>
        </div>
      </div>
    </section>
  );
}

export default function StressHero({ stressLevel, stressScore, motion, timestamp }) {
  const stressClass =
    stressLevel === 'High'   ? 'stress--high'
    : stressLevel === 'Medium' ? 'stress--medium'
    : 'stress--low';

  const isActive = motion === 'Active';
  const score = stressScore != null ? Math.round(stressScore) : null;

  return (
    <section className="hero-section">
      <div className="stress-ring-wrap">
        <div className={`stress-ring ${stressClass}`}>
          <div className="stress-ring-inner">
            <span className="stress-score">{score ?? '—'}</span>
            <span className="stress-label">{stressLevel || 'Low'}</span>
            <span className="stress-sublabel">/ 100</span>
          </div>
        </div>
      </div>

      <div className="hero-meta">
        <p className="last-update-label">Last updated</p>
        <p className="last-update-time">{timestamp || '—'}</p>
        <p className={`motion-status ${isActive ? 'motion--active' : 'motion--inactive'}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{isActive ? 'Body Active' : motion ? 'Body at Rest' : 'Waiting…'}</span>
        </p>
      </div>
    </section>
  );
}

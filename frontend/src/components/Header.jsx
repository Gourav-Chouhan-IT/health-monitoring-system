export default function Header({ connected, isHardware }) {
  const connClass = connected ? 'badge badge--online' : 'badge badge--offline';
  const connText = connected ? 'Live' : 'Offline';

  let sourceClass = 'badge badge--demo';
  let sourceText = 'Connecting…';
  if (connected) {
    sourceClass = isHardware ? 'badge badge--hardware' : 'badge badge--demo';
    sourceText = isHardware ? 'Hardware' : 'Demo Mode';
  }

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span>StressWatch</span>
        </div>
      </div>
      <div className="header-right">
        <div className={sourceClass}>
          <span className="badge-dot" />
          <span>{sourceText}</span>
        </div>
        <div className={connClass}>
          <span className="badge-dot" />
          <span>{connText}</span>
        </div>
      </div>
    </header>
  );
}

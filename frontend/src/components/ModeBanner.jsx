export default function ModeBanner({ isHardware, connected }) {
  let bannerClass = 'mode-banner mode-banner--offline';
  let icon = '⏳';
  let title = 'Connecting…';
  let sub = 'Waiting for server';
  let pill = '—';

  if (connected) {
    if (isHardware) {
      bannerClass = 'mode-banner mode-banner--live';
      icon = '📡';
      title = 'Live — Hardware Connected';
      sub = 'Receiving real sensor data from your wearable device';
      pill = 'Live';
    } else {
      bannerClass = 'mode-banner mode-banner--demo';
      icon = '🎮';
      title = 'Demo Mode — Simulated Data';
      sub = 'No hardware detected. Connect your device or use the controls below.';
      pill = 'Demo';
    }
  }

  return (
    <div className={bannerClass}>
      <span className="mode-banner-icon">{icon}</span>
      <div className="mode-banner-text">
        <span id="mode-banner-title">{title}</span>
        <span id="mode-banner-sub">{sub}</span>
      </div>
      <div className="mode-banner-pill">{pill}</div>
    </div>
  );
}

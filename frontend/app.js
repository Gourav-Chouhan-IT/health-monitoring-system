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

const BACKEND = 'http://localhost:5000';
const MAX_HISTORY = 30;

// ─── DOM refs ───────────────────────────────
const $  = id => document.getElementById(id);
const connBadge   = $('conn-badge');
const sourceBadge = $('source-badge');
const stressRing  = $('stress-ring');
const stressLabel = $('stress-label');
const timestamp   = $('timestamp');
const motionStatus= $('motion-status');
const motionText  = $('motion-text');
const hrVal       = $('hr-val');
const spo2Val     = $('spo2-val');
const tempVal     = $('temp-val');
const hrBar       = $('hr-bar');
const spo2Bar     = $('spo2-bar');
const tempBar     = $('temp-bar');
const beatDot     = $('hr-beat');
const modeFeedback    = $('mode-feedback');
const modeBanner      = $('mode-banner');
const modeBannerTitle = $('mode-banner-title');
const modeBannerSub   = $('mode-banner-sub');
const modeBannerPill  = $('mode-banner-pill');

// ─── Chart setup ────────────────────────────
const hrHistory  = [];
const timeLabels = [];

const hrChart = new Chart($('hr-chart'), {
  type: 'line',
  data: {
    labels: timeLabels,
    datasets: [{
      label: 'Heart Rate',
      data: hrHistory,
      borderColor: '#c26252',
      backgroundColor: 'rgba(194,98,82,.1)',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: true,
      tension: 0.4,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#F7F4F1',
        borderColor: 'rgba(92,79,74,.15)',
        borderWidth: 1,
        titleColor: '#9a8880',
        bodyColor: '#3a2e2a',
        callbacks: { label: ctx => ` ${ctx.parsed.y} bpm` }
      }
    },
    scales: {
      x: {
        ticks: { color: '#9a8880', font: { size: 11 }, maxTicksLimit: 6 },
        grid: { color: 'rgba(92,79,74,.07)' },
        border: { color: 'rgba(92,79,74,.12)' }
      },
      y: {
        ticks: { color: '#9a8880', font: { size: 11 } },
        grid: { color: 'rgba(92,79,74,.07)' },
        border: { color: 'rgba(92,79,74,.12)' },
        suggestedMin: 50,
        suggestedMax: 140,
      }
    }
  }
});

// ─── Socket.IO connection ────────────────────
const socket = io(BACKEND, { transports: ['websocket', 'polling'] });

socket.on('connect', () => {
  connBadge.className = 'badge badge--online';
  connBadge.innerHTML = '<span class="badge-dot"></span><span>Live</span>';
  showToast('Connected to server');
});

socket.on('disconnect', () => {
  connBadge.className = 'badge badge--offline';
  connBadge.innerHTML = '<span class="badge-dot"></span><span>Offline</span>';
  showToast('Disconnected — reconnecting…');
});

socket.on('new-reading', reading => {
  updateDashboard(reading);
});

// ─── Dashboard update ────────────────────────
function updateDashboard(d) {
  const { heartRate, spo2, temperature, stressLevel, motion, isHardware, timestamp: ts } = d;

  // Source badge + mode banner
  if (isHardware) {
    sourceBadge.className = 'badge badge--hardware';
    sourceBadge.innerHTML = '<span class="badge-dot"></span><span>Hardware</span>';

    modeBanner.className      = 'mode-banner mode-banner--live';
    modeBannerTitle.textContent = 'Live — Hardware Connected';
    modeBannerSub.textContent   = 'Receiving real sensor data from your wearable device';
    modeBannerPill.textContent  = 'Live';
  } else {
    sourceBadge.className = 'badge badge--demo';
    sourceBadge.innerHTML = '<span class="badge-dot"></span><span>Demo Mode</span>';

    modeBanner.className      = 'mode-banner mode-banner--demo';
    modeBannerTitle.textContent = 'Demo Mode — Simulated Data';
    modeBannerSub.textContent   = 'No hardware detected. Connect your device or use the controls below.';
    modeBannerPill.textContent  = 'Demo';
  }

  // Timestamp
  timestamp.textContent = ts || new Date().toLocaleTimeString();

  // Motion
  const isActive = motion === 'Active';
  motionStatus.className = `motion-status ${isActive ? 'motion--active' : 'motion--inactive'}`;
  motionText.textContent = isActive ? 'Body Active' : 'Body at Rest';

  // Stress ring
  const stressClass = stressLevel === 'High' ? 'stress--high'
                    : stressLevel === 'Medium' ? 'stress--medium'
                    : 'stress--low';
  stressRing.className = `stress-ring ${stressClass}`;
  stressLabel.textContent = stressLevel || 'Low';

  // Metric values
  const hr   = Math.round(heartRate) || 0;
  const sp   = Math.round(spo2) || 0;
  const temp = typeof temperature === 'number' ? temperature.toFixed(1) : '—';

  hrVal.textContent   = hr   || '—';
  spo2Val.textContent = sp   || '—';
  tempVal.textContent = temp;

  // Mini bars
  hrBar.style.width   = `${clamp((hr / 180) * 100, 0, 100)}%`;
  spo2Bar.style.width = `${clamp(((sp - 90) / 10) * 100, 0, 100)}%`;
  tempBar.style.width = `${clamp(((parseFloat(temp) - 35) / 5) * 100, 0, 100)}%`;

  // HR colour — driven by backend stressLevel, not local HR thresholds
  hrVal.style.color = stressLevel === 'High'   ? 'var(--stress-high)'
                    : stressLevel === 'Medium'  ? 'var(--caramel)'
                    : 'var(--text)';

  // Heartbeat animation
  triggerBeat();

  // Chart history
  const label = ts || new Date().toLocaleTimeString();
  hrHistory.push(hr);
  timeLabels.push(label);
  if (hrHistory.length > MAX_HISTORY) { hrHistory.shift(); timeLabels.shift(); }
  hrChart.update('none');
}

// ─── Beat animation ──────────────────────────
function triggerBeat() {
  beatDot.classList.remove('beating');
  void beatDot.offsetWidth; // reflow
  beatDot.classList.add('beating');
}

// ─── Demo control ────────────────────────────
let modeTimer = null;

async function setMode(mode) {
  try {
    await fetch(`${BACKEND}/api/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });

    // Button active state
    ['NORMAL','STRESS','ACTIVE'].forEach(m => {
      const btn = $(`btn-${m.toLowerCase()}`);
      if (btn) btn.classList.toggle('ctrl-btn--active', m === mode);
    });

    const labels = { NORMAL: 'Normal mode active', STRESS: 'High stress simulation — resets in 15 s', ACTIVE: 'Active/exercise simulation — resets in 15 s' };
    modeFeedback.textContent = labels[mode] || '';

    if (mode !== 'NORMAL') {
      clearTimeout(modeTimer);
      modeTimer = setTimeout(() => {
        $('btn-normal')?.classList.add('ctrl-btn--active');
        $('btn-stress')?.classList.remove('ctrl-btn--active');
        $('btn-active')?.classList.remove('ctrl-btn--active');
        modeFeedback.textContent = 'Reset to normal mode';
      }, 15000);
    }

    showToast(`Mode: ${mode}`);
  } catch (e) {
    showToast('Could not reach server');
  }
}

// ─── Toast ───────────────────────────────────
let toastTimer;
function showToast(msg) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ─── Helpers ─────────────────────────────────
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

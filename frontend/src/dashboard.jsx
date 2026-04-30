import { useState, useEffect } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from "recharts";

const generateHR = (base = 72) => Math.round(base + (Math.random() - 0.5) * 12);
const generateHistory = () => Array.from({ length: 30 }, (_, i) => ({ t: i, v: generateHR() }));

export default function Dashboard() {
  const [hr, setHr] = useState(72);
  const [hrHistory, setHrHistory] = useState(generateHistory());
  const [activeTab, setActiveTab] = useState("overview");
  const [time, setTime] = useState(new Date());
  const [alert, setAlert] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const spo2 = 98;
  const temp = 36.6;
  const gsr = 430;
  const steps = 6241;
  const stress = 42;
  const motion = "MOVED";

  useEffect(() => {
    const interval = setInterval(() => {
      const newHr = generateHR(72);
      setHr(newHr);
      setHrHistory(prev => [...prev.slice(1), { t: Date.now(), v: newHr }]);
      setTime(new Date());
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const stressColor = stress < 35 ? "#059669" : stress < 65 ? "#D97706" : "#DC2626";
  const stressLabel = stress < 35 ? "Low" : stress < 65 ? "Moderate" : "High";

  const navItems = [
    { id: "overview", icon: "⬡", label: "Overview" },
    { id: "heart", icon: "♥", label: "Heart Rate" },
    { id: "vitals", icon: "◎", label: "Vitals" },
    { id: "activity", icon: "◈", label: "Activity" },
    { id: "history", icon: "▦", label: "History" },
    { id: "settings", icon: "⚙", label: "Settings" },
  ];

  const StressArc = ({ score }) => {
    const r = 62, cx = 85, cy = 82;
    const angle = (score / 100) * Math.PI;
    const x = cx + r * Math.cos(Math.PI + angle);
    const y = cy + r * Math.sin(Math.PI + angle);
    const trackD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
    const fillD = score > 0 ? `M ${cx - r} ${cy} A ${r} ${r} 0 ${angle > Math.PI / 2 ? 1 : 0} 1 ${x} ${y}` : "";
    const col = score < 35 ? "#059669" : score < 65 ? "#D97706" : "#DC2626";
    return (
      <svg width={170} height={92} viewBox="0 0 170 92">
        <path d={trackD} fill="none" stroke="#E5E2DC" strokeWidth={10} strokeLinecap="round" />
        {fillD && <path d={fillD} fill="none" stroke={col} strokeWidth={10} strokeLinecap="round" />}
        {score > 0 && <circle cx={x} cy={y} r={5} fill={col} />}
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize={26} fontFamily="'DM Mono', monospace" fontWeight={700} fill={col}>{score}</text>
        <text x={cx} y={cy + 24} textAnchor="middle" fontSize={10} fontFamily="'DM Sans', sans-serif" fill="#9CA3AF">{stressLabel} Stress</text>
      </svg>
    );
  };

  const Card = ({ children, style = {}, span = 1 }) => (
    <div style={{
      background: "#FAF9F6",
      borderRadius: 16,
      padding: "20px 24px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      border: "1px solid #E5E2DC",
      gridColumn: span > 1 ? `span ${span}` : undefined,
      transition: "box-shadow 0.2s",
      ...style
    }}>
      {children}
    </div>
  );

  const Label = ({ children }) => (
    <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: 6 }}>{children}</div>
  );

  const BigNum = ({ value, unit, color = "#1A1A2E" }) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
      <span style={{ fontSize: 42, fontFamily: "'DM Mono', monospace", fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 13, color: "#9CA3AF" }}>{unit}</span>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0EEE9", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .pulse { animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.25)} }
        .fadein { animation: fadein 0.3s ease; }
        @keyframes fadein { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .nav-btn { transition: background 0.15s, color 0.15s; cursor: pointer; border: none; background: none; width: 100%; text-align: left; }
        .nav-btn:hover { background: rgba(0,0,0,0.04) !important; }
        .card-hover:hover { box-shadow: 0 6px 28px rgba(0,0,0,0.1) !important; }
      `}</style>

      {/* ───── SIDEBAR ───── */}
      <aside style={{
        width: sidebarOpen ? 220 : 64,
        background: "#FAF9F6",
        borderRight: "1px solid #E5E2DC",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: "18px 14px", borderBottom: "1px solid #E5E2DC", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: "#DC2626", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff"
          }}>♥</div>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", whiteSpace: "nowrap" }}>HealthMon</div>
              <div style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "'DM Mono', monospace" }}>ESP32 · Live</div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: "10px 8px" }}>
          {navItems.map(item => (
            <button
              key={item.id}
              className="nav-btn"
              onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 10px", borderRadius: 10, marginBottom: 2,
                background: activeTab === item.id ? "#F0EEE9" : "transparent",
                color: activeTab === item.id ? "#1A1A2E" : "#6B7280",
                fontWeight: activeTab === item.id ? 600 : 400,
                fontSize: 13, fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <span style={{ fontSize: 15, width: 20, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
              {sidebarOpen && activeTab === item.id && (
                <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#DC2626" }} />
              )}
            </button>
          ))}
        </nav>

        {/* Connection badge */}
        <div style={{ padding: "14px", borderTop: "1px solid #E5E2DC" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span className="pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669", display: "inline-block", flexShrink: 0 }} />
            {sidebarOpen && <span style={{ fontSize: 11, color: "#059669", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>Connected</span>}
          </div>
          {sidebarOpen && <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2, fontFamily: "'DM Mono', monospace" }}>192.168.1.42:8000</div>}
        </div>

        {/* Toggle */}
        <button onClick={() => setSidebarOpen(p => !p)} style={{
          padding: "12px", background: "none", border: "none", borderTop: "1px solid #E5E2DC",
          cursor: "pointer", color: "#9CA3AF", fontSize: 12,
          textAlign: sidebarOpen ? "right" : "center", fontFamily: "'DM Mono', monospace"
        }}>
          {sidebarOpen ? "◀ collapse" : "▶"}
        </button>
      </aside>

      {/* ───── MAIN ───── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Topbar */}
        <div style={{
          background: "#FAF9F6", borderBottom: "1px solid #E5E2DC",
          padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1A2E" }}>Overview</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "'DM Mono', monospace" }}>
              {time.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })} · {time.toLocaleTimeString()}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ background: "#F3F4F6", borderRadius: 10, padding: "6px 14px", fontSize: 12, color: "#6B7280" }}>Patient: User 01</div>
            <div style={{ background: "#ECFDF5", borderRadius: 10, padding: "6px 14px", fontSize: 12, color: "#059669", fontWeight: 600 }}>
              ● Live Feed
            </div>
          </div>
        </div>

        {/* Alert Banner */}
        {alert && (
          <div className="fadein" style={{
            background: "#FEF3C7", borderBottom: "1px solid #FDE68A",
            padding: "10px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>⚠️</span>
              <span style={{ fontSize: 13, color: "#92400E", fontWeight: 500 }}>
                GSR elevated — moderate stress detected. Heart rate above resting average. Consider a short break.
              </span>
            </div>
            <button onClick={() => setAlert(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#92400E", fontSize: 22, lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Dashboard Grid */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "22px 28px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "auto auto auto",
          gap: 18,
          alignContent: "start"
        }}>

          {/* ── Heart Rate (full width) ── */}
          <div className="card-hover" style={{
            gridColumn: "span 3", background: "#FAF9F6", borderRadius: 16,
            padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            border: "1px solid #E5E2DC", transition: "box-shadow 0.2s"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <Label>Heart Rate</Label>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 46, fontFamily: "'DM Mono', monospace", fontWeight: 700, color: "#DC2626", lineHeight: 1 }}>{hr}</span>
                  <span style={{ fontSize: 14, color: "#9CA3AF" }}>bpm</span>
                  <span className="pulse" style={{ fontSize: 22, color: "#DC2626" }}>♥</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>Today's range</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>62 – 94 bpm</div>
                <div style={{ marginTop: 6, background: "#FEF2F2", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#DC2626", fontWeight: 600 }}>
                  MAX30102
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={85}>
              <AreaChart data={hrHistory}>
                <defs>
                  <linearGradient id="hrg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis domain={[55, 100]} hide />
                <Tooltip contentStyle={{ background: "#FAF9F6", border: "1px solid #E5E2DC", borderRadius: 8, fontSize: 12 }} formatter={v => [`${v} bpm`]} labelFormatter={() => ""} />
                <Area type="monotone" dataKey="v" stroke="#DC2626" strokeWidth={2} fill="url(#hrg)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── Stress Gauge ── */}
          <div className="card-hover" style={{
            background: "#FAF9F6", borderRadius: 16, padding: "20px 24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #E5E2DC",
            transition: "box-shadow 0.2s", display: "flex", flexDirection: "column", alignItems: "center"
          }}>
            <Label>Stress Index</Label>
            <div style={{ marginTop: 4 }}>
              <StressArc score={stress} />
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
              {[["Low", "#059669"], ["Moderate", "#D97706"], ["High", "#DC2626"]].map(([l, c]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />
                  <span style={{ fontSize: 10, color: "#9CA3AF" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── SpO2 ── */}
          <div className="card-hover" style={{
            background: "#FAF9F6", borderRadius: 16, padding: "20px 24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #E5E2DC",
            transition: "box-shadow 0.2s"
          }}>
            <Label>Blood Oxygen (SpO₂)</Label>
            <BigNum value={spo2} unit="%" color="#5B52E8" />
            <div style={{ margin: "14px 0 6px", height: 8, borderRadius: 4, background: "#E5E2DC", overflow: "hidden" }}>
              <div style={{ width: `${spo2}%`, height: "100%", background: "linear-gradient(90deg,#5B52E8,#818CF8)", borderRadius: 4 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9CA3AF", fontFamily: "'DM Mono', monospace" }}>
              <span>0%</span>
              <span style={{ color: "#059669", fontWeight: 600 }}>● Normal ≥ 95%</span>
              <span>100%</span>
            </div>
          </div>

          {/* ── Temperature ── */}
          <div className="card-hover" style={{
            background: "#FAF9F6", borderRadius: 16, padding: "20px 24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #E5E2DC",
            transition: "box-shadow 0.2s"
          }}>
            <Label>Body Temperature</Label>
            <BigNum value={temp} unit="°C" color="#D97706" />
            <div style={{ marginTop: 14, background: "#F0EEE9", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>Normal range</div>
              <div style={{ fontSize: 13, color: "#1A1A2E", fontWeight: 600 }}>36.1 °C – 37.2 °C</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
                <span style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>Within normal range</span>
              </div>
            </div>
          </div>

          {/* ── Activity Tracker (full width) ── */}
          <div className="card-hover" style={{
            gridColumn: "span 3", background: "#FAF9F6", borderRadius: 16,
            padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            border: "1px solid #E5E2DC", transition: "box-shadow 0.2s"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <Label>Activity Tracker · ADXL345</Label>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 42, fontFamily: "'DM Mono', monospace", fontWeight: 700, color: "#1A1A2E", lineHeight: 1 }}>{steps.toLocaleString()}</span>
                  <span style={{ fontSize: 13, color: "#9CA3AF" }}>steps today</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{
                  background: motion === "MOVED" ? "#ECFDF5" : "#F3F4F6",
                  borderRadius: 10, padding: "8px 16px", fontSize: 13,
                  color: motion === "MOVED" ? "#059669" : "#6B7280", fontWeight: 600
                }}>
                  {motion === "MOVED" ? "🚶 Moving" : "🧍 Still"}
                </div>
                <div style={{ background: "#F0EEE9", borderRadius: 10, padding: "8px 16px", fontSize: 12, color: "#6B7280" }}>
                  GSR: {gsr} µS
                </div>
              </div>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: "#E5E2DC", overflow: "hidden", marginBottom: 8 }}>
              <div style={{
                width: `${Math.min((steps / 10000) * 100, 100)}%`, height: "100%",
                background: "linear-gradient(90deg,#059669,#34D399)", borderRadius: 5
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9CA3AF", fontFamily: "'DM Mono', monospace" }}>
              <span>0</span>
              <span style={{ color: "#059669", fontWeight: 600 }}>{Math.round((steps / 10000) * 100)}% of 10,000 daily goal</span>
              <span>10,000</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

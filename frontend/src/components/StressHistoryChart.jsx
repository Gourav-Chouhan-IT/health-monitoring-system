import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const score = Math.round(payload[0].value);
  const level = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low';
  const color = score >= 70 ? '#c26252' : score >= 40 ? '#C9996B' : '#5C766D';
  return (
    <div style={{
      background: '#F7F4F1',
      border: '1px solid rgba(92,79,74,.15)',
      borderRadius: 8,
      padding: '6px 10px',
      fontSize: 12,
    }}>
      <p style={{ color: '#9a8880', marginBottom: 3 }}>{label}</p>
      <p style={{ fontWeight: 700, color }}>
        {score}
        <span style={{ fontWeight: 500, color: '#9a8880' }}> / 100 — {level}</span>
      </p>
    </div>
  );
};

export default function StressHistoryChart({ data }) {
  return (
    <section className="chart-section card">
      <div className="chart-header">
        <span className="card-title">Stress Score History</span>
        <span className="chart-range">last 30 readings · 0 – 100</span>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="stressAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#c26252" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#c26252" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {/* ── Coloured zone bands ── */}
            <ReferenceArea y1={0}  y2={40}  fill="rgba(92,118,109,.07)"  ifOverflow="visible" />
            <ReferenceArea y1={40} y2={70}  fill="rgba(201,153,107,.07)" ifOverflow="visible" />
            <ReferenceArea y1={70} y2={100} fill="rgba(194,98,82,.07)"   ifOverflow="visible" />

            {/* ── Zone boundary ticks ── */}
            <ReferenceLine y={40} stroke="rgba(201,153,107,.4)" strokeDasharray="4 3" />
            <ReferenceLine y={70} stroke="rgba(194,98,82,.4)"   strokeDasharray="4 3" />

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,79,74,.07)" />

            <XAxis
              dataKey="time"
              tick={{ fill: '#9a8880', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(92,79,74,.12)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 40, 70, 100]}
              tick={{ fill: '#9a8880', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(92,79,74,.12)' }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="stressScore"
              stroke="#C9996B"
              strokeWidth={2.5}
              fill="url(#stressAreaGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#C9996B', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

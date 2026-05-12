import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

export default function SensorChart({
  data,
  label,
  dataKey,
  unit,
  color,
  domain,
}) {
  return (
    <section className="chart-section card">
      <div className="chart-header">
        <span className="card-title">{label} History</span>
        <span className="chart-range">last 30 readings</span>
      </div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(92,79,74,.07)" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#9a8880', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(92,79,74,.12)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={domain}
              tick={{ fill: '#9a8880', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(92,79,74,.12)' }}
            />
            <Tooltip
              contentStyle={{
                background: '#F7F4F1',
                border: '1px solid rgba(92,79,74,.15)',
                borderRadius: 8,
                fontSize: 13,
              }}
              labelStyle={{ color: '#9a8880' }}
              itemStyle={{ color: '#3a2e2a' }}
              formatter={(v) => [`${v} ${unit}`, label]}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function SimpleAreaChart({ data }) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" hide />
          <YAxis hide type="number" domain={['dataMin - 10', 'dataMax + 10']} />
          <Tooltip 
            labelFormatter={(label) => `Time: ${label}s`} 
            cursor={false} 
            activeDot={false} 
          />
          <Area 
            type="monotone" 
            dataKey="v" 
            name="Heart Rate" 
            stroke="#8884d8" 
            fill="#8884d8" 
            isAnimationActive={true} 
            animationDuration={1200} 
            animationEasing="linear" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SimpleAreaChart;
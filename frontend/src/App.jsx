import { useState, useEffect } from "react";
import SimpleAreaChart from "./charts";

function App() {
  const [heartRate, setHeartRate] = useState(0);
  const [heartRateHistory, setHeartRateHistory] = useState([]);
  const [activityLevel, setActivityLevel] = useState("Resting");
  const [bodyTemp, setBodyTemp] = useState(0);
  const [bloodOxygen, setBloodOxygen] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [time, setTime] = useState(new Date());
  const [alert, setAlert] = useState(true);

  // Fetch history on page load
  useEffect(() => {
    fetch("http://localhost:8000/history")
      .then(res => res.json())
      .then(data => {
        setHeartRateHistory(data.map((d, i) => ({ t: i, v: d.bpm })));
        if (data.length > 0) {
          const latest = data[data.length - 1];
          setHeartRate(latest.bpm);
          setBodyTemp(latest.temp);
          setBloodOxygen(latest.spo2);
        }
      });
  }, []);

  // WebSocket — live data
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => console.log("WebSocket connected");

    ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  setHeartRate(data.bpm);
  setBodyTemp(data.temp);
  setBloodOxygen(data.spo2);
  setTime(new Date());
  setHeartRateHistory(prev => {
    const lastT = prev.length > 0 ? prev[prev.length - 1].t : 0;
    return [...prev.slice(1), { t: lastT + 1, v: data.bpm }];
  });
};

    ws.onerror = (err) => console.log("WebSocket error:", err);
    ws.onclose = () => console.log("WebSocket closed");

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Activity level derived from heart rate
  useEffect(() => {
    if (heartRate > 100) setActivityLevel("Exercising");
    else if (heartRate > 70) setActivityLevel("Active");
    else setActivityLevel("Resting");
  }, [heartRate]);

  const activityIcon = {
    "Resting": "🧘‍♂️",
    "Active": "🚶‍♂️",
    "Exercising": "🏃‍♂️"
  };

  // Temperature threshold logic
  const isTempNormal = bodyTemp >= 36.1 && bodyTemp <= 37.2;
  const isTempHigh = bodyTemp > 37.2;
  const tempStatusText = isTempNormal ? "Within normal range" : (isTempHigh ? "Above normal (Fever)" : "Below normal (Hypothermia)");
  const tempTextColor = isTempNormal ? "text-text-primary" : (isTempHigh ? "text-red-500" : "text-blue-500");
  const tempNumberColor = isTempNormal ? "text-warning" : (isTempHigh ? "text-red-500" : "text-blue-500");

  // Blood oxygen threshold logic
  const isOxygenNormal = bloodOxygen >= 95;
  const oxygenStatusText = isOxygenNormal ? "Normal > 95%" : "Warning: Low Oxygen";
  const oxygenBarColor = isOxygenNormal ? "bg-primary" : "bg-red-500";
  const oxygenNumberColor = isOxygenNormal ? "text-primary" : "text-red-500";

  return (
    <main className="min-h-screen bg-surface px-4 py-8 grid gap-6 md:grid-cols-3 max-w-7xl mx-auto content-start items-start auto-rows-max">

      {/*Heart Rate Card */}
      <div className="card   p-8 md:col-span-3 text-text-primary/70 flex flex-col min-h-[25rem] w-full">
        <h3 className="font-mono text-sm uppercase tracking-[0.18em] text-text-secondary">Heart Rate</h3>

        <SimpleAreaChart data={heartRateHistory} />

        <div className="mt-auto">
          <p className="font-mono uppercase text-text-secondary text-5xl font-bold ">{heartRate} bpm</p>
          <p className="font-mono text-text-secondary">current reading</p>
        </div>
      </div>

      {/*Activity Level Card */}
      <div className="card  min-h-[320px] p-8 text-text-primary/70 flex flex-col items-center w-full md:max-w-sm md:justify-self-center">
        <h3 className="mt-2 font-mono text-sm uppercase tracking-[0.18em] text-text-secondary">Activity Level</h3>
        <span className="mt-6 flex h-[120px] w-[120px] bg-green-50 items-center justify-center rounded-full border-[6px] border-solid border-green-500 text-green-600 text-5xl">

          {/* REPLACE THE HARDCODED EMOJI WITH THIS */}
          {activityIcon[activityLevel]}

        </span>
        <p className="mt-6 text-4xl font-bold">{activityLevel}</p>
      </div>

      {/*Body Temperature Card */}
      <div className="card min-h-[320px]  p-8 text-text-primary/70 flex flex-col items-start w-full md:max-w-sm md:justify-self-center">
        <h3 className="font-mono text-sm uppercase tracking-[0.18em] text-text-secondary">Body Temperature</h3>

        <div className="mt-3 flex items-end gap-1">
          {/* 🔴 We use tempNumberColor here */}
          <span className={`text-[4.2rem] leading-[0.88] font-bold ${tempNumberColor}`}>{bodyTemp}</span>
          <p className="mb-2 text-2xl leading-none text-text-secondary">°C</p>
        </div>

        <div className="mt-5 w-full rounded-2xl bg-background p-5">
          <p className="font-mono text-sm tracking-wide text-text-secondary">Normal range</p>
          <p className="mt-2 text-[1.85rem] font-semibold leading-none text-text-primary">36.1°C - 37.2°C</p>
          {/* 🔴 We use tempTextColor and tempStatusText here */}
          <p className={`mt-3 text-lg font-semibold ${tempTextColor}`}>• {tempStatusText}</p>
        </div>
      </div>

      {/*Blood Oxygen Card */}
      <div className="card min-h-[320px]  p-8 text-text-primary/70 flex flex-col items-start w-full md:max-w-sm md:justify-self-center ">
        <h3 className="font-mono text-sm uppercase tracking-[0.18em] text-text-secondary">Blood Oxygen (SpO₂)</h3>
        <div className="mt-8 flex items-end gap-1">
          {/* 🔴 We use oxygenNumberColor here */}
          <span className={`text-[4.2rem] leading-[0.88] font-bold ${oxygenNumberColor}`}>{bloodOxygen}</span>
          <p className="mb-2 text-2xl leading-none text-text-secondary">%</p>
        </div>

        <div className="mt-5 h-3 w-full rounded-full bg-primary/25 overflow-hidden">
          {/* 🔴 We use oxygenBarColor here AND keep your dynamic width inline style! */}
          <div className={`h-full rounded-full transition-all duration-500 ${oxygenBarColor}`} style={{ width: `${bloodOxygen}%` }}></div>
        </div>

        <div className="mt-2 grid w-full grid-cols-3 items-center gap-2 font-mono text-base text-text-secondary">
          <span>0%</span>
          {/* 🔴 We use oxygenStatusText and oxygenNumberColor here */}
          <span className={`text-center whitespace-nowrap font-semibold ${oxygenNumberColor}`}>• {oxygenStatusText}</span>
          <span className="text-right">100%</span>
        </div>
      </div>
    </main>
  )
}

export default App
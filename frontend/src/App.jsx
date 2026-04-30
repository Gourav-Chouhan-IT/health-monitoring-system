import { useState, useEffect } from "react";
import SimpleAreaChart from "./charts";

const generateHR = (base = 72) => Math.round(base + (Math.random() - 0.5) * 12);
const generateHistory = () => Array.from({ length: 30 }, (_, i) => ({ t: i, v: generateHR() }));

function App() {
  const [heartRate, setHeartRate] = useState(72);
  
  // 🔴 FIX 1: Initialize with generateHistory() so the chart isn't empty at startup
  const [heartRateHistory, setHeartRateHistory] = useState(generateHistory());
  
  const [activityLevel, setActivityLevel] = useState("Active");
  const [bodyTemp, setBodyTemp] = useState(36.6);
  const [bloodOxygen, setBloodOxygen] = useState(98);
  const [activeTab, setActiveTab] = useState("overview");
  const [time, setTime] = useState(new Date());
  const [alert, setAlert] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      const newheartRate = generateHR(72);
      setHeartRate(newheartRate);
      setHeartRateHistory(prev => [...prev.slice(1), 
        { t: prev[prev.length - 1].t + 1
        , v: newheartRate }]);
      setTime(new Date());
    }, 1200);
    return () => clearInterval(interval);
  }, [])

  useEffect(() =>{
    const interval = setInterval(()=>{
      const newTemp = (Math.random() * 0.4 + 36.4).toFixed(1);
      setBodyTemp(newTemp);
    }, 3000);
    return () => clearInterval(interval);
  },[])

  useEffect(()=>{
    const interval = setInterval(()=>{
      const newOxygen = Math.round(95 + Math.random() * 5);
      setBloodOxygen(newOxygen);
    }, 2500);
    return () => clearInterval(interval);
  },[])

  useEffect(() => {
  if (heartRate > 100) setActivityLevel("Exercising");
  else if (heartRate > 70) setActivityLevel("Active");
  else setActivityLevel("Resting");
}, [heartRate]);

  // Define the activityIcon mapping inside the component so it can use the activityLevel state
  const activityIcon = {
    "Resting": "🧘‍♂️",
    "Active": "🚶‍♂️",
    "Exercising": "🏃‍♂️"
  };

  // 1. Temperature Threshold Logic
  const isTempNormal = bodyTemp >= 36.1 && bodyTemp <= 37.2;
  const isTempHigh = bodyTemp > 37.2;
  
  // Decide what text to show
  const tempStatusText = isTempNormal ? "Within normal range" : (isTempHigh ? "Above normal (Fever)" : "Below normal (Hypothermia)");
  
  // Decide what color the text should be
  const tempTextColor = isTempNormal ? "text-text-primary" : (isTempHigh ? "text-red-500" : "text-blue-500");
  const tempNumberColor = isTempNormal ? "text-warning" : (isTempHigh ? "text-red-500" : "text-blue-500");

  // 2. Blood Oxygen Threshold Logic
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
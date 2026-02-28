import { Activity } from 'lucide-react'

function App() {
  return (
    <main className="min-h-screen bg-surface px-4 py-8 grid gap-6 md:grid-cols-3 max-w-7xl mx-auto">

    {/*Heart Rate Card */}
      <div className="card mb-10 p-8 md:col-span-3 text-text-primary/70 flex flex-col min-h-[25rem] w-full">
        <h3 className="font-mono text-sm uppercase tracking-[0.18em] text-text-secondary">Heart Rate</h3>

        <div className="mt-auto">
          <p className="font-mono uppercase text-text-secondary text-5xl font-bold ">72 bpm</p>
          <p className="font-mono text-text-secondary">current reading</p>
        </div>
      </div>

       {/*Activity Level Card */}
      <div className="card mb-10 p-8 text-text-primary/70 flex flex-col items-center w-full md:max-w-sm md:justify-self-center">
        <h3 className="mt-2 font-mono text-sm uppercase tracking-[0.18em] text-text-secondary">Activity Level</h3>
        <span className="mt-6 flex h-[120px] w-[120px] bg-green-50 items-center justify-center rounded-full border-[6px] border-solid border-green-500 text-green-600 text-5xl">
          🏃‍♂️
        </span>
        <p className="mt-6 text-4xl font-bold">Active</p>
      </div>

      {/*Body Temperature Card */} 
      <div className="card mb-10 p-8 text-text-primary/70 flex flex-col items-start w-full md:max-w-sm md:justify-self-center">
        <h3 className="font-mono text-sm uppercase tracking-[0.18em] text-text-secondary">Body Temperature</h3>

        <div className="mt-3 flex items-end gap-1">
          <span className="text-[4.2rem] leading-[0.88] font-bold text-warning">36.6</span>
          <p className="mb-2 text-2xl leading-none text-text-secondary">°C</p>
        </div>

        <div className="mt-5 w-full rounded-2xl bg-background p-5">
          <p className="font-mono text-sm tracking-wide text-text-secondary">Normal range</p>
          <p className="mt-2 text-[1.85rem] font-semibold leading-none text-text-primary">36.1°C - 37.2°C</p>
          <p className="mt-3 text-lg font-semibold text-normal">• Within normal range</p>
        </div>
      </div>

      {/*Blood Oxygen Card */}
      <div className="card mb-10 p-8 text-text-primary/70 flex flex-col items-start w-full md:max-w-sm md:justify-self-center">
        <h3 className="font-mono text-sm uppercase tracking-[0.18em] text-text-secondary">Blood Oxygen (SpO₂)</h3>
        <div className="mt-8 flex items-end gap-1">
          <span className="text-[4.2rem] leading-[0.88] font-bold text-primary">98</span>
          <p className="mb-2 text-2xl leading-none text-text-secondary">%</p>
        </div>

        <div className="mt-5 h-3 w-full rounded-full bg-primary/25">
          <div className="h-full w-[98%] rounded-full bg-primary"></div>
        </div>

        <div className="mt-2 grid w-full grid-cols-3 items-center gap-2 font-mono text-base text-text-secondary">
          <span>0%</span>
          <span className="text-center text-normal whitespace-nowrap">• Normal &gt; 95%</span>
          <span className="text-right">100%</span>
        </div>
      </div>
    </main>
  )
}

export default App

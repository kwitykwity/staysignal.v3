import { useState, useEffect, useRef } from "react"
import axios from "axios"
import QatarMarket from "./QatarMarket"

const CHANNELS = [
  "Online TA", "Direct", "Corporate",
  "Offline TA/TO", "Groups", "Other"
]

const COUNTRIES = [
  "PRT", "GBR", "FRA", "ESP", "DEU", "ITA", "IRL",
  "BEL", "BRA", "NLD", "USA", "CHN", "AUT", "ROU",
  "POL", "SWE", "CHE", "RUS", "NOR", "DNK"
]

const SAMPLE = {
  channel: "Online TA",
  lead_time: 210,
  country: "PRT",
  special_requests: 0
}

function ScoreGauge({ score, risk_label }) {
  const color =
    score >= 70 ? "#22c55e" :
    score >= 40 ? "#f59e0b" : "#ef4444"

  const label_color =
    score >= 70 ? "text-green-400" :
    score >= 40 ? "text-amber-400" : "text-red-400"

  const radius = 54
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius}
          fill="none" stroke="#1e293b" strokeWidth="12" />
        <circle cx="70" cy="70" r={radius}
          fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
        <text x="70" y="65" textAnchor="middle"
          fill="white" fontSize="28" fontWeight="bold">{score}</text>
        <text x="70" y="85" textAnchor="middle"
          fill="#94a3b8" fontSize="11">out of 100</text>
      </svg>
      <span className={`text-lg font-semibold ${label_color}`}>
        {risk_label}
      </span>
    </div>
  )
}

function BookingScorer() {
  const [form, setForm] = useState(SAMPLE)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const debounceRef = useRef(null)

  const score = async (data) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post("https://staysignal-v3-api.onrender.com/score", {
        channel: data.channel,
        lead_time: Number(data.lead_time),
        country: data.country,
        special_requests: Number(data.special_requests)
      })
      setResult(res.data)
    } catch (e) {
      setError("Could not reach the API. Make sure uvicorn is running.")
    }
    setLoading(false)
  }

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => score(form), 400)
  }, [form])

  const update = (field, value) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const reset = () => setForm(SAMPLE)

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">

      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2">Know before they cancel.</h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
          Enter four booking details. Get an instant Booking Quality Score
          powered by 119,390 real hotel booking records.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-200">Booking details</h2>
          <button onClick={reset}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Load sample ↺
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">

          {/* Channel */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">
              Booking channel
              <span className="ml-1 text-slate-600">· cancellation rates vary 15–61% by channel</span>
            </label>
            <select
              value={form.channel}
              onChange={e => update("channel", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
              {CHANNELS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Lead time */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">
              Lead time (days between booking and arrival)
              <span className="ml-1 text-slate-600">· 180+ days = 57% cancel rate</span>
            </label>
            <input
              type="number" min="0" max="500"
              value={form.lead_time}
              onChange={e => update("lead_time", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">
              Guest country of origin
            </label>
            <select
              value={form.country}
              onChange={e => update("country", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
              {COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Special requests */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">
              Number of special requests
              <span className="ml-1 text-slate-600">· 0 requests = 47.7% cancel · 5 requests = 5%</span>
            </label>
            <div className="flex gap-2">
              {[0,1,2,3,4,5].map(n => (
                <button key={n}
                  onClick={() => update("special_requests", n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                    ${form.special_requests === n
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Result card */}
      {error && (
        <div className="bg-red-950 border border-red-800 rounded-2xl p-4 text-red-400 text-sm">{error}</div>
      )}

      {result && !error && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col items-center mb-6">
            <ScoreGauge
              score={result.quality_score}
              risk_label={result.risk_label} />
            <p className="text-slate-500 text-xs mt-2">
              {result.cancel_probability}% estimated cancellation probability
            </p>
          </div>

          {/* Drivers */}
          <div className="mb-5">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              Risk drivers
            </h3>
            <ul className="space-y-2">
              {result.drivers.map((d, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-amber-400 mt-0.5">→</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended action */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">
              Recommended action
            </p>
            <p className="text-sm text-white">{result.recommended_action}</p>
          </div>

          {loading && (
            <p className="text-center text-slate-600 text-xs mt-4">Updating score...</p>
          )}
        </div>
      )}

    </main>
  )
}

export default function App() {
  const [tab, setTab] = useState("scorer")

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-sm">S</div>
        <span className="font-semibold text-lg tracking-tight">StaySignal</span>

        <nav className="ml-6 flex gap-1">
          <button
            onClick={() => setTab("scorer")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${tab === "scorer" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}>
            Score a Booking
          </button>
          <button
            onClick={() => setTab("qatar")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${tab === "qatar" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}>
            Qatar Market
          </button>
        </nav>

        <span className="ml-auto text-slate-500 text-sm hidden sm:inline">
          {tab === "scorer" ? "Booking Quality Scorer" : "Demand Intelligence"}
        </span>
      </header>

      {tab === "scorer" ? <BookingScorer /> : <QatarMarket />}

    </div>
  )
}

import { useMemo, useState } from "react"
import {
  ComposedChart, Line, Bar, BarChart, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceArea
} from "recharts"
import rawData from "./data/qatarMarketData.json"

const SEGMENTS = [
  "Qatar+",
  "5 Star Hotels+",
  "4 Star Hotels+",
  "3 Star Hotels+",
  "1 & 2 Star Hotels+",
  "Deluxe Apartments+",
  "Standard Apartments+"
]

// Known real-world market events overlaid on the trend line as annotations.
// These are not derived from the dataset — they're general-knowledge context
// added the same way the team's original chart mockup did.
const EVENTS = [
  { x1: "2020-03", x2: "2021-06", label: "COVID-19", color: "#ef4444" },
  { x1: "2022-11", x2: "2022-12", label: "FIFA World Cup", color: "#f59e0b" }
]

function formatDate(d) {
  const [y, m] = d.split("-")
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(m)-1]} '${y.slice(2)}`
}

function StatCard({ label, value, sublabel, accent }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex-1">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: accent }}>{value}</p>
      {sublabel && <p className="text-xs text-slate-500 mt-1">{sublabel}</p>}
    </div>
  )
}

export default function QatarMarket() {
  const [segment, setSegment] = useState("Qatar+")

  const segmentSeries = useMemo(() => {
    return rawData
      .filter(r => r.segment === segment)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(r => ({ ...r, dateLabel: formatDate(r.date) }))
  }, [segment])

  const latest = segmentSeries[segmentSeries.length - 1]

  const trailing12 = segmentSeries.slice(-12)
  const priorTrailing12 = segmentSeries.slice(-24, -12)

  const avg = (arr, key) =>
    arr.length ? arr.reduce((sum, r) => sum + r[key], 0) / arr.length : null

  const current = {
    occupancy_rate: avg(trailing12, "occupancy_rate"),
    adr: avg(trailing12, "adr"),
    revpar: avg(trailing12, "revpar")
  }
  const prior = {
    occupancy_rate: avg(priorTrailing12, "occupancy_rate"),
    adr: avg(priorTrailing12, "adr"),
    revpar: avg(priorTrailing12, "revpar")
  }

  const delta = (key) => {
    if (current[key] == null || prior[key] == null) return null
    return current[key] - prior[key]
  }

  const latestBysegment = useMemo(() => {
    const bySeg = {}
    for (const r of rawData) {
      if (!bySeg[r.segment] || r.date > bySeg[r.segment].date) bySeg[r.segment] = r
    }
    return SEGMENTS.filter(s => s !== "Qatar+" && bySeg[s]).map(s => ({
      segment: s.replace(" Hotels+", "").replace("+", ""),
      occupancy_rate: bySeg[s].occupancy_rate,
      adr: bySeg[s].adr,
      revpar: bySeg[s].revpar
    }))
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Qatar Market Context</h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-lg mx-auto">
          Monthly occupancy, ADR, and RevPAR trends across Qatar's hospitality
          segments, 2014–2025. Source: Data.gov.qa.
        </p>
      </div>

      {/* Segment selector */}
      <div className="mb-6 flex justify-center">
        <select
          value={segment}
          onChange={e => setSegment(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
          {SEGMENTS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Stat cards */}
      {latest && current.occupancy_rate != null && (
        <>
          <p className="text-center text-xs text-slate-500 mb-3">
            Trailing 12-month average ({trailing12[0]?.date && formatDate(trailing12[0].date)} – {formatDate(latest.date)}) · vs. prior 12 months
          </p>
          <div className="flex gap-4 mb-8">
            <StatCard
              label="Occupancy Rate"
              value={`${current.occupancy_rate.toFixed(1)}%`}
              sublabel={delta("occupancy_rate") != null ? `${delta("occupancy_rate") >= 0 ? "+" : ""}${delta("occupancy_rate").toFixed(1)} pts YoY` : null}
              accent="#38bdf8"
            />
            <StatCard
              label="ADR"
              value={`${current.adr.toFixed(0)} QAR`}
              sublabel={delta("adr") != null ? `${delta("adr") >= 0 ? "+" : ""}${delta("adr").toFixed(0)} QAR YoY` : null}
              accent="#22c55e"
            />
            <StatCard
              label="RevPAR"
              value={`${current.revpar.toFixed(0)} QAR`}
              sublabel={delta("revpar") != null ? `${delta("revpar") >= 0 ? "+" : ""}${delta("revpar").toFixed(0)} QAR YoY` : null}
              accent="#a78bfa"
            />
          </div>
        </>
      )}

      {/* Trend chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-slate-200 mb-1">{segment} — Performance Over Time</h2>
        <p className="text-xs text-slate-500 mb-4">
          Shaded bands mark known market events, added for context — not derived from the dataset.
        </p>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={segmentSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis
              dataKey="dateLabel"
              stroke="#64748b"
              fontSize={11}
              interval={Math.floor(segmentSeries.length / 8)}
            />
            <YAxis yAxisId="left" stroke="#38bdf8" fontSize={11} unit="%" />
            <YAxis yAxisId="right" orientation="right" stroke="#22c55e" fontSize={11} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {EVENTS.map(ev => {
              const x1Label = formatDate(ev.x1)
              const x2Label = formatDate(ev.x2)
              const inRange = segmentSeries.some(d => d.date >= ev.x1 && d.date <= ev.x2)
              if (!inRange) return null
              return (
                <ReferenceArea
                  key={ev.label}
                  yAxisId="left"
                  x1={x1Label}
                  x2={x2Label}
                  fill={ev.color}
                  fillOpacity={0.08}
                  stroke={ev.color}
                  strokeOpacity={0.3}
                  label={{ value: ev.label, position: "insideTop", fill: ev.color, fontSize: 10 }}
                />
              )
            })}
            <Line yAxisId="left" type="monotone" dataKey="occupancy_rate" name="Occupancy Rate (%)" stroke="#38bdf8" dot={false} strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="adr" name="ADR (QAR)" stroke="#22c55e" dot={false} strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="revpar" name="RevPAR (QAR)" stroke="#a78bfa" dot={false} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Segment comparison */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="font-semibold text-slate-200 mb-1">Segment Comparison — Latest Month</h2>
        <p className="text-xs text-slate-500 mb-4">Occupancy rate by property tier, most recent reporting month.</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={latestBysegment} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="segment" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} unit="%" />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Bar dataKey="occupancy_rate" name="Occupancy Rate (%)" fill="#38bdf8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}

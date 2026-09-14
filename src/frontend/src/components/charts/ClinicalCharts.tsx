/**
 * Shared Recharts-based chart components.
 * All charts include a synthetic-data disclaimer in the caption.
 */

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import type { WeeklyAdherencePoint, OutcomePoint } from '@/types/api'

// ── Colour helpers ─────────────────────────────────────────────────────────────
function adherenceColor(pct: number): string {
  if (pct >= 80) return '#16a34a'
  if (pct >= 60) return '#d97706'
  return '#dc2626'
}

// ── Weekly Adherence Bar Chart ─────────────────────────────────────────────────
interface AdherenceChartProps {
  data: WeeklyAdherencePoint[]
  plannedPerWeek: number
}

export function AdherenceBarChart({ data, plannedPerWeek }: AdherenceChartProps) {
  if (!data.length) return null

  const chartData = data.map((w) => ({
    ...w,
    missed_display: w.missed > 0 ? w.missed : 0,
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="week_label" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, plannedPerWeek + 1]} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value, name) => [
              value,
              name === 'completed' ? 'Completed' : 'Missed',
            ]}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="completed" name="completed" stackId="a" radius={[0, 0, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={adherenceColor(entry.adherence_pct)} />
            ))}
          </Bar>
          <Bar dataKey="missed_display" name="missed" stackId="a" fill="#fca5a5" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[10px] text-slate-400">
        ⚠ Synthetic demo data — patient-reported adherence
      </p>
    </div>
  )
}

// ── Pain / Comfort Trend Line Chart ───────────────────────────────────────────
interface OutcomeChartProps {
  data: OutcomePoint[]
  showComfort?: boolean
}

export function OutcomeTrendChart({ data, showComfort = true }: OutcomeChartProps) {
  if (!data.length) return null

  const chartData = data.map((d) => ({
    date: new Date(d.session_date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    }),
    pain: d.pain,
    comfort: d.comfort,
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <ReferenceLine y={7} stroke="#fca5a5" strokeDasharray="4 2" label={{ value: 'High pain', fontSize: 10, fill: '#dc2626' }} />
          <Line
            type="monotone"
            dataKey="pain"
            name="Pain"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          {showComfort && (
            <Line
              type="monotone"
              dataKey="comfort"
              name="Comfort"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              strokeDasharray="4 2"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[10px] text-slate-400">
        ⚠ Synthetic demo data — patient-reported pain &amp; comfort scores (0–10)
      </p>
    </div>
  )
}

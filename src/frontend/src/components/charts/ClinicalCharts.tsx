/**
 * Shared Recharts-based chart components with dark theme styling.
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
  if (pct >= 80) return '#10b981'
  if (pct >= 60) return '#f59e0b'
  return '#f43f5e'
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
    <div className="w-full">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="week_label" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#334155" />
          <YAxis domain={[0, plannedPerWeek + 1]} tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#334155" />
          <Tooltip
            formatter={(value, name) => [
              value,
              name === 'completed' ? 'Completed Sessions' : 'Missed Sessions',
            ]}
            contentStyle={{
              backgroundColor: '#091322',
              borderColor: 'rgba(6, 182, 212, 0.3)',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#f8fafc',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          />
          <Bar dataKey="completed" name="completed" stackId="a" radius={[0, 0, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={adherenceColor(entry.adherence_pct)} />
            ))}
          </Bar>
          <Bar dataKey="missed_display" name="missed" stackId="a" fill="#f43f5e88" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-center text-[10px] text-slate-400 font-mono">
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
    <div className="w-full">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" interval="preserveStartEnd" />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#334155" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#091322',
              borderColor: 'rgba(6, 182, 212, 0.3)',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#f8fafc',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          />
          <ReferenceLine
            y={7}
            stroke="#f43f5e"
            strokeDasharray="4 2"
            label={{ value: 'High Discomfort (≥7)', fontSize: 10, fill: '#f43f5e', position: 'top' }}
          />
          <Line
            type="monotone"
            dataKey="pain"
            name="Reported Discomfort"
            stroke="#f43f5e"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#f43f5e' }}
            activeDot={{ r: 6, fill: '#f43f5e' }}
          />
          {showComfort && (
            <Line
              type="monotone"
              dataKey="comfort"
              name="Reported Comfort"
              stroke="#06b6d4"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#06b6d4' }}
              activeDot={{ r: 6, fill: '#06b6d4' }}
              strokeDasharray="4 2"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-2 text-center text-[10px] text-slate-400 font-mono">
        ⚠ Synthetic demonstration trajectory — 0 to 10 scale
      </p>
    </div>
  )
}

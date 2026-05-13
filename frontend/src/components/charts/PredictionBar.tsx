'use client'

import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface PredictionBarProps {
  homeWinPct: number
  drawPct: number
  awayWinPct: number
  homeTeam: string
  awayTeam: string
}

export function PredictionBar({ homeWinPct, drawPct, awayWinPct, homeTeam, awayTeam }: PredictionBarProps) {
  const data = [
    { name: homeTeam || 'Home', value: homeWinPct, color: '#10b981' }, // accent-500
    { name: 'Draw', value: drawPct, color: '#f59e0b' },                // amber-500
    { name: awayTeam || 'Away', value: awayWinPct, color: '#ef4444' }, // red-500
  ]

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: 500 }}
            width={100}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="glass-sm px-3 py-2 rounded-lg border-white/10">
                    <span className="text-white font-medium">
                      {payload[0].payload.name}: <span className="text-primary-400">{payload[0].value}%</span>
                    </span>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="value" barSize={16} radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface FormChartProps {
  form: string[]  // ['W', 'L', 'D', 'W', 'W']
  teamName: string
}

const getColor = (result: string) => {
  switch (result) {
    case 'W': return '#10b981'  // accent-500
    case 'D': return '#f59e0b'  // amber-500
    case 'L': return '#ef4444'  // red-500
    default: return '#475569'   // slate-600
  }
}

export function FormChart({ form, teamName }: FormChartProps) {
  if (!form || form.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-500">
        No recent matches
      </div>
    )
  }

  const data = form.map((result, index) => ({
    name: `Match ${index + 1}`,
    result,
    value: result === 'W' ? 3 : result === 'D' ? 1 : result === 'L' ? 0.2 : 0, // 0.2 just to show a tiny bar for loss
  }))

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" hide />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const result = payload[0].payload.result
                const points = result === 'W' ? 3 : result === 'D' ? 1 : 0
                return (
                  <div className="glass-sm px-3 py-2 text-sm rounded-lg border-white/10">
                    <span className="text-white font-medium">
                      {result}: <span className="text-gray-400">{points} pts</span>
                    </span>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={32}>
            {data.map((entry, index) => (
              <Cell key={index} fill={getColor(entry.result)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

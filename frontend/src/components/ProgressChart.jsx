import React from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-4 py-3 text-xs border-brand-500/40 shadow-glow-sm bg-dark-900/90 backdrop-blur-xl">
      <p className="text-brand-300 font-mono tracking-widest uppercase mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-mono text-sm font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: p.color }}></span>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export function ScoreTrendChart({ data = [] }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-40 font-mono text-xs uppercase tracking-widest text-slate-500">NO TRAJECTORY DATA</div>
  )
  const formatted = data.map((d, i) => ({
    name: `SEQ-${String(i + 1).padStart(2, '0')}`,
    score: d.score,
    category: d.category
  }))
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={formatted} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <filter id="glow-line" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#475885', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} dy={10} />
        <YAxis domain={[0, 100]} tick={{ fill: '#475885', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} dx={-10} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(79,157,255,0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#4F9DFF"
          strokeWidth={3}
          filter="url(#glow-line)"
          dot={{ fill: '#0B0F1A', stroke: '#4F9DFF', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: '#4F9DFF', stroke: '#fff', strokeWidth: 2 }}
          name="Score"
          animationDuration={2000}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function CategoryBarChart({ data = {} }) {
  const categories = Object.entries(data).map(([cat, d]) => ({
    name: cat.slice(0, 4).toUpperCase(),
    avg: d.avg,
    count: d.count
  }))
  if (!categories.length) return (
    <div className="flex items-center justify-center h-40 font-mono text-xs uppercase tracking-widest text-slate-500">NO CATEGORY DATA</div>
  )
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={categories} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={1}/>
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.2}/>
          </linearGradient>
          <filter id="glow-bar" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#475885', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} dy={10} />
        <YAxis domain={[0, 100]} tick={{ fill: '#475885', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} dx={-10} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34,211,238,0.1)' }} />
        <Bar 
          dataKey="avg" 
          fill="url(#barGlow)" 
          radius={[6, 6, 0, 0]} 
          name="Avg Score" 
          maxBarSize={48}
          filter="url(#glow-bar)"
          animationDuration={2000}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

import React from 'react'
import { CATEGORIES } from '../data/questions'

const colorMap = {
  violet: { pill: 'border-accent-violet/40 bg-accent-violet/10 text-accent-violet', active: 'border-accent-violet bg-accent-violet/20 text-white shadow-[0_0_16px_rgba(167,139,250,0.3)]' },
  cyan:   { pill: 'border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan',     active: 'border-accent-cyan bg-accent-cyan/20 text-white shadow-[0_0_16px_rgba(34,211,238,0.3)]' },
  amber:  { pill: 'border-accent-amber/40 bg-accent-amber/10 text-accent-amber',  active: 'border-accent-amber bg-accent-amber/20 text-white shadow-[0_0_16px_rgba(251,191,36,0.3)]' },
  green:  { pill: 'border-accent-green/40 bg-accent-green/10 text-accent-green',  active: 'border-accent-green bg-accent-green/20 text-white shadow-[0_0_16px_rgba(52,211,153,0.3)]' },
}

export default function CategorySelector({ selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map(cat => {
        const isActive = selected === cat.id
        const c = colorMap[cat.color]
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-medium text-sm transition-all duration-200
              ${isActive ? c.active : `${c.pill} hover:bg-white/[0.05]`}`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}

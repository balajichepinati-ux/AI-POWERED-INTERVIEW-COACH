import React from 'react'
import { CheckCircle, AlertTriangle, MessageSquare, Lightbulb, RotateCcw, HelpCircle, Zap } from 'lucide-react'

function Card({ icon: Icon, iconColor, title, children, className = '' }) {
  return (
    <div className={`glass-card p-5 space-y-3 ${className}`}>
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon size={14} />
        </div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      {children}
    </div>
  )
}

export function StrengthsCard({ strengths = [] }) {
  return (
    <Card icon={CheckCircle} iconColor="bg-accent-green/20 text-accent-green" title="Strengths">
      <ul className="space-y-2">
        {strengths.map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
            <span className="w-1.5 h-1.5 bg-accent-green rounded-full mt-1.5 shrink-0" />
            {s}
          </li>
        ))}
        {strengths.length === 0 && <li className="text-sm text-slate-500">No data</li>}
      </ul>
    </Card>
  )
}

export function ImprovementsCard({ improvements = [] }) {
  return (
    <Card icon={AlertTriangle} iconColor="bg-accent-amber/20 text-accent-amber" title="Improvements">
      <ul className="space-y-2">
        {improvements.map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
            <span className="w-1.5 h-1.5 bg-accent-amber rounded-full mt-1.5 shrink-0" />
            {s}
          </li>
        ))}
        {improvements.length === 0 && <li className="text-sm text-slate-500">No data</li>}
      </ul>
    </Card>
  )
}

export function FillerWordsCard({ fillerWords = [] }) {
  return (
    <Card icon={MessageSquare} iconColor="bg-rose-500/20 text-rose-400" title="Filler Words Detected">
      {fillerWords.length === 0 ? (
        <div className="flex items-center gap-2 text-accent-green text-sm">
          <CheckCircle size={14} />
          No filler words detected! Great fluency.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {fillerWords.map((w, i) => (
            <span key={i} className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-mono">
              "{w}"
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}

export function RewriteCard({ rewrite = '' }) {
  return (
    <Card icon={Lightbulb} iconColor="bg-accent-cyan/20 text-accent-cyan" title="Suggested Rewrite">
      <p className="text-sm text-slate-300 leading-relaxed italic">
        "{rewrite || 'No suggestion available.'}"
      </p>
    </Card>
  )
}

export function FollowUpCard({ question = '' }) {
  return (
    <Card icon={HelpCircle} iconColor="bg-brand-500/20 text-brand-400" title="Predicted Follow-Up">
      <p className="text-sm text-slate-200 font-medium leading-relaxed">
        {question || '—'}
      </p>
    </Card>
  )
}

export function VerdictCard({ verdict = '', summary = '' }) {
  const verdictStyles = {
    'Strong':  'text-accent-green bg-accent-green/10 border-accent-green/30',
    'Good':    'text-brand-400  bg-brand-500/10  border-brand-500/30',
    'Average': 'text-accent-amber bg-accent-amber/10 border-accent-amber/30',
    'Weak':    'text-rose-400   bg-rose-500/10   border-rose-500/30',
  }
  const style = verdictStyles[verdict] || verdictStyles['Average']
  return (
    <Card icon={Zap} iconColor="bg-brand-500/20 text-brand-400" title="Overall Verdict">
      <div className="flex items-center gap-3 mb-2">
        <span className={`px-3 py-1 rounded-full border text-sm font-semibold ${style}`}>
          {verdict || 'Average'}
        </span>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
    </Card>
  )
}

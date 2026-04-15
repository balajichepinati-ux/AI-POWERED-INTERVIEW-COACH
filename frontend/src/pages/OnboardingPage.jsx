import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, FileText, Sparkles, CheckCircle } from 'lucide-react'
import ResumeUpload from '../components/ResumeUpload'
import { useAuth } from '../context/AuthContext'

export default function OnboardingPage() {
  const { getUserDisplayName } = useAuth()
  const navigate = useNavigate()
  const [resumeData, setResumeData] = useState(null)
  const [skipped, setSkipped] = useState(false)

  const handleContinue = () => {
    if (resumeData) {
      sessionStorage.setItem('mockmate_resume', JSON.stringify(resumeData))
    }
    navigate('/practice')
  }

  const firstName = getUserDisplayName().split(' ')[0]

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-mesh px-4">
      <div className="w-full max-w-lg space-y-6 animate-slide-up">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600/20 border border-brand-500/30 rounded-2xl mb-4">
            <FileText size={26} className="text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome, {firstName}! 👋
          </h1>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Upload your resume so MockMate can generate questions tailored to your exact background.
          </p>
        </div>

        {/* Upload */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-accent-amber" />
            <span className="text-sm font-medium text-white">Resume Upload</span>
            <span className="ml-auto text-xs text-slate-500">Optional but recommended</span>
          </div>
          <ResumeUpload onResumeData={setResumeData} />
        </div>

        {/* Benefits list */}
        <div className="glass-card p-5 space-y-2.5">
          <p className="text-xs font-medium text-slate-400 mb-3">With your resume, MockMate will:</p>
          {[
            'Generate questions about your specific projects and experience',
            'Identify your technical strengths and likely interview domains',
            'Ask follow-up questions about your actual achievements',
            'Adapt difficulty to your background level',
          ].map(b => (
            <div key={b} className="flex items-center gap-2.5 text-sm text-slate-300">
              <CheckCircle size={14} className="text-accent-green shrink-0" />
              {b}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button onClick={handleContinue} className="btn-primary w-full py-3.5">
            {resumeData ? (
              <><FileText size={16} /> Continue with Resume <ArrowRight size={15} /></>
            ) : (
              <><ArrowRight size={16} /> Skip for Now </>
            )}
          </button>
          {!resumeData && (
            <p className="text-center text-xs text-slate-500">
              You can upload later from the Practice page
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ResumeUpload from '../components/ResumeUpload'

export default function ResumePage() {
  const navigate = useNavigate()
  const [resumeData, setResumeData] = useState(null)

  const handleResumeData = (data) => {
    setResumeData(data)
    // Save to sessionStorage for use in PracticePage
    try {
      sessionStorage.setItem('mockmate_resume', JSON.stringify(data))
      console.log('[ResumePage] Resume saved to session:', data.parsed?.targetRole)
    } catch (err) {
      console.warn('[ResumePage] Failed to save resume to session:', err.message)
    }
  }

  const handleContinue = () => {
    if (resumeData) {
      navigate('/onboarding', { state: { resumeData } })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 pt-20">
      <div className="container mx-auto px-4">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Upload Your Resume</h1>
            <p className="text-slate-400 mt-1">Let us analyze your resume to personalize your interview practice</p>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-2xl mx-auto">
          <ResumeUpload onResumeData={handleResumeData} compact={false} />

          {/* Continue button */}
          {resumeData && (
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => navigate('/onboarding')}
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Continue to Onboarding
              </button>
              <button
                onClick={() => setResumeData(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Upload Different File
              </button>
            </div>
          )}

          {/* Info section */}
          <div className="mt-12 bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">Why upload your resume?</h3>
            <ul className="space-y-3 text-slate-300 text-sm">
              <li className="flex gap-3">
                <span className="text-brand-500 font-bold">✓</span>
                <span>We analyze your skills and experience to create personalized interview questions</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-500 font-bold">✓</span>
                <span>Questions are tailored to your background and job target</span>
              </li>
              <li className="flex gap-3">
                <span className="text-brand-500 font-bold">✓</span>
                <span>Track improvements specific to your role and industry</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

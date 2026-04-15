import React, { useCallback, useState, useEffect } from 'react'
import { Upload, CheckCircle, AlertCircle, X, Loader, Sparkles } from 'lucide-react'
import GeminiService from '../lib/gemini'
import { analyzeResume } from '../lib/api'

// ─────────────────────────────────────────────
// Utility: Extract text from PDF using pdf.js
// ─────────────────────────────────────────────
async function extractPdfText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        // Use pdf.js from CDN loaded globally
        if (!window.pdfjsLib) {
          // Fallback: read as text if pdf.js not available
          resolve(new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(e.target.result)))
          return
        }
        const pdf = await window.pdfjsLib.getDocument({ data: e.target.result }).promise
        let text = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map(item => item.str).join(' ') + '\n'
        }
        resolve(text)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// ─────────────────────────────────────────────
// Utility: Extract text from DOCX using mammoth
// ─────────────────────────────────────────────
async function extractDocxText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        if (!window.mammoth) {
          resolve('')
          return
        }
        const result = await window.mammoth.extractRawText({ arrayBuffer: e.target.result })
        resolve(result.value)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// ─────────────────────────────────────────────
// Parse resume text with Gemini (uses optimized Call 1)
// ─────────────────────────────────────────────
async function parseResumeWithGemini(text) {
  // Use the combined call — returns profile + questions in one shot
  const result = await GeminiService.analyzeResumeAndGenerateQuestions(text, 'Behavioral', 5)
  const p = result.profile || {}
  return {
    name: p.name || null,
    skills: p.skills || [],
    tools: p.tools || [],
    languages: [],
    frameworks: [],
    projects: [],
    experience: (p.experience || []).map(e => typeof e === 'string' ? { role: e, company: '', duration: '', highlights: [] } : e),
    education: [],
    achievements: p.strengths || [],
    targetRole: p.targetRole || 'Software Developer',
    difficultyLevel: p.difficultyLevel || 'Intermediate',
    _cachedQuestions: result.questions || [],
  }
}

// ─────────────────────────────────────────────
// FINAL FALLBACK: Extract profile from text using regex
// No API calls — works 100% offline
// ─────────────────────────────────────────────
function extractProfileFromText(text) {
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean)

  // Common tech skills to scan for
  const KNOWN_SKILLS = [
    'JavaScript','TypeScript','Python','Java','C++','C#','Go','Rust','Swift','Kotlin','PHP','Ruby',
    'React','Vue','Angular','Next.js','Node.js','Express','Django','Flask','Spring','Laravel',
    'SQL','MySQL','PostgreSQL','MongoDB','Redis','Firebase','Supabase',
    'HTML','CSS','TailwindCSS','Bootstrap','SASS',
    'Git','Docker','Kubernetes','AWS','GCP','Azure','Linux',
    'REST','GraphQL','API','Microservices','CI/CD','DevOps',
    'Machine Learning','AI','TensorFlow','PyTorch','NLP','Data Science',
    'Figma','Photoshop','UI/UX','Agile','Scrum',
  ]

  // Detect skills present in text
  const textLower = text.toLowerCase()
  const skills = KNOWN_SKILLS.filter(s => textLower.includes(s.toLowerCase()))

  // Try to extract name (first non-blank line that looks like a name)
  const nameLine = lines.find(l => l.length < 40 && /^[A-Z][a-z]+ [A-Z]/.test(l))

  // Try to extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/)

  // Infer target role from common role keywords
  const ROLES = [
    'Software Engineer','Software Developer','Frontend Developer','Backend Developer',
    'Full Stack Developer','Data Scientist','Data Analyst','ML Engineer',
    'DevOps Engineer','Cloud Engineer','Product Manager','UI/UX Designer',
    'Web Developer','Mobile Developer','Android Developer','iOS Developer',
  ]
  const detectedRole = ROLES.find(r => textLower.includes(r.toLowerCase())) || 'Software Developer'

  return {
    name: nameLine || null,
    email: emailMatch?.[0] || null,
    skills: skills.slice(0, 12),
    tools: skills.slice(12, 20),
    languages: [],
    frameworks: [],
    projects: [],
    experience: [],
    education: [],
    achievements: [],
    targetRole: detectedRole,
    difficultyLevel: 'Intermediate',
    _cachedQuestions: [], // Will trigger fresh question generation
    _offlineMode: true,
  }
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function ResumeUpload({ onResumeData, compact = false }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  // Load pdf.js and mammoth from CDN dynamically
  useEffect(() => {
    if (!window.pdfjsLib) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      }
      document.head.appendChild(script)
    }
    if (!window.mammoth) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'
      document.head.appendChild(script)
    }
  }, [])

  const processFile = async (f) => {
    if (!f) return
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
    const isPdf = f.type === 'application/pdf' || f.name.match(/\.pdf$/i)
    const isDocx = f.type.includes('word') || f.name.match(/\.docx?$/i)

    if (!allowed.includes(f.type) && !f.name.match(/\.(pdf|docx|doc)$/i)) {
      setError('Please upload a PDF or DOCX file.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.')
      return
    }

    setFile(f)
    setError('')
    setLoading(true)

    try {
      // Step 1: Extract text
      setLoadingStep('Extracting text...')
      let extractedText = ''

      if (isPdf) {
        extractedText = await extractPdfText(f)
      } else if (isDocx) {
        extractedText = await extractDocxText(f)
      }

      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('Could not extract text from resume. Please try a different file.')
      }

      // Step 2: Analyze with AI (3-tier fallback)
      setLoadingStep('Analyzing with AI...')
      let analysis
      try {
        // Tier 1: Backend
        const backendResponse = await analyzeResume(extractedText)
        analysis = backendResponse.analysis
        console.log('[ResumeUpload] Tier 1 (backend) success:', analysis)
      } catch (backendErr) {
        console.warn('[ResumeUpload] Tier 1 failed:', backendErr.message)
        try {
          // Tier 2: Gemini direct
          setLoadingStep('Connecting to AI...')
          analysis = await parseResumeWithGemini(extractedText)
          console.log('[ResumeUpload] Tier 2 (Gemini) success')
        } catch (geminiErr) {
          console.warn('[ResumeUpload] Tier 2 failed:', geminiErr.message)
          // Tier 3: Zero-API offline extraction — ALWAYS works
          setLoadingStep('Using offline extraction...')
          analysis = extractProfileFromText(extractedText)
          console.log('[ResumeUpload] Tier 3 (offline) used — skills found:', analysis.skills)
        }
      }

      const resumeResult = {
        fileName: f.name,
        fileUrl: null,
        extractedText: extractedText.substring(0, 5000),
        parsed: analysis,
        wordCount: extractedText.split(/\s+/).filter(Boolean).length,
        rawText: extractedText // Keep full text for backend
      }

      setResult(resumeResult)
      onResumeData?.(resumeResult)

    } catch (err) {
      console.error('[ResumeUpload]', err)
      setError(err.message || 'Failed to parse resume. Please try again.')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }, [])

  const onFileInput = (e) => {
    const f = e.target.files[0]
    if (f) processFile(f)
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setError('')
    onResumeData?.(null)
  }

  // ── Success State ──
  if (result && !compact) {
    return (
      <div className="glass-card p-5 space-y-4 border-accent-green/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-green/10 border border-accent-green/30 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} className="text-accent-green" />
            </div>
            <div>
              <p className="font-medium text-white text-sm flex items-center gap-2">
                Resume Parsed <Sparkles size={12} className="text-accent-amber" />
              </p>
              <p className="text-xs text-slate-500">{file?.name} · {result.wordCount} words</p>
            </div>
          </div>
          <button onClick={reset} className="text-slate-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Skills & Tools preview */}
        <div className="grid grid-cols-2 gap-3">
          {result.parsed?.skills?.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Skills Detected</p>
              <div className="flex flex-wrap gap-1">
                {result.parsed.skills.slice(0, 6).map(s => (
                  <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">{s}</span>
                ))}
                {result.parsed.skills.length > 6 && (
                  <span className="text-[10px] text-slate-500">+{result.parsed.skills.length - 6}</span>
                )}
              </div>
            </div>
          )}
          {result.parsed?.tools?.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Tools</p>
              <div className="flex flex-wrap gap-1">
                {result.parsed.tools.slice(0, 5).map(t => (
                  <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {result.parsed?.targetRole && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <span className="text-xs text-slate-500">Inferred role:</span>
            <span className="text-xs font-semibold text-brand-300">{result.parsed.targetRole}</span>
          </div>
        )}
      </div>
    )
  }

  // ── Upload State ──
  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer group
          ${dragging ? 'border-brand-500 bg-brand-500/10' : 'border-white/[0.10] hover:border-brand-500/50 hover:bg-dark-600/40'}`}
        onClick={() => document.getElementById('resume-input-file').click()}
      >
        <input id="resume-input-file" type="file" accept=".pdf,.docx,.doc" className="hidden" onChange={onFileInput} />

        {loading ? (
          <div className="space-y-3">
            <Loader size={32} className="mx-auto text-brand-400 animate-spin" />
            <p className="text-sm text-slate-400">{loadingStep || 'Processing...'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`w-14 h-14 mx-auto rounded-2xl border flex items-center justify-center transition-all
              ${dragging ? 'bg-brand-500/20 border-brand-500/40' : 'bg-dark-600/60 border-white/[0.08] group-hover:bg-brand-500/10 group-hover:border-brand-500/30'}`}>
              <Upload size={24} className={`${dragging ? 'text-brand-400' : 'text-slate-500 group-hover:text-brand-400'} transition-colors`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                {dragging ? 'Drop your resume here' : 'Upload your resume'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Drag & drop or click · PDF or DOCX · Max 10MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
          <AlertCircle size={14} className="text-rose-400 shrink-0" />
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      )}
    </div>
  )
}

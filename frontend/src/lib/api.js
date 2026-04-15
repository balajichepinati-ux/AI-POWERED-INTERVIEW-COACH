import { getQuestionsByCategory } from '../data/questions'
import { getAuthHeader, refreshAccessToken, clearTokens } from './supabase'
import GeminiService from './gemini'
import { generateFromProfile } from './questionGenerator'

const API_URL = import.meta.env.VITE_API_URL || '/api'

// Enhanced request helper with authentication
async function request(path, options = {}) {
  const url = `${API_URL}${path}`
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  }

  let res = await fetch(url, {
    ...options,
    headers
  })

  // If 401, try to refresh token and retry
  if (res.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      // Retry with new token
      const newHeaders = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...options.headers
      }
      res = await fetch(url, {
        ...options,
        headers: newHeaders
      })
    } else {
      // Refresh failed, logout
      clearTokens()
      window.location.href = '/auth'
      throw new Error('Session expired. Please login again.')
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

// Resume upload
export async function uploadResume(file, userId) {
  const formData = new FormData()
  formData.append('resume', file)
  if (userId) formData.append('userId', userId)

  const headers = getAuthHeader()

  const res = await fetch(`${API_URL}/resume/upload`, {
    method: 'POST',
    headers,
    body: formData
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Upload failed')
  }
  return res.json()
}

// ============================================
// CALL 1: Analyze Resume + Generate Questions (single Gemini call)
// ============================================
export async function analyzeResume(resumeText) {
  try {
    // Try backend first
    const data = await request('/analyze/resume', {
      method: 'POST',
      body: JSON.stringify({ resumeText })
    })
    console.log('[API] Resume analyzed via backend:', data.analysis)
    return data
  } catch (err) {
    console.warn('[API] Backend unavailable, using Gemini directly:', err.message)
    // Fallback: use combined call, return profile as analysis
    const result = await GeminiService.analyzeResumeAndGenerateQuestions(resumeText, 'Behavioral', 1)
    return { success: true, analysis: result.profile }
  }
}

// ============================================
// Generate Questions from parsed resume profile (for any category)
// Always uses the resume context — never falls back silently
// ============================================
export async function generateQuestionsFromAnalysis(analysis, category = 'Behavioral', count = 5) {
  // ── Tier 0: Zero-API Offline Templates (Primary path) ──────────────────────
  // Instant, offline, guaranteed, and highly personalized based on the extracted profile
  try {
    const offlineQuestions = generateFromProfile(analysis, category, count)
    if (offlineQuestions && offlineQuestions.length > 0) {
      console.log(`[API] ✅ Tier 0 (Template) returned ${offlineQuestions.length} personalized questions (${category})`)
      return { success: true, questions: offlineQuestions, _source: 'template' }
    }
  } catch (err) {
    console.warn('[API] Tier 0 (Template) failed:', err.message)
  }

  // Build a rich resume profile summary from every available field
  const skills       = (analysis.skills       || []).filter(Boolean)
  const tools        = (analysis.tools        || analysis.technologies || analysis.frameworks || []).filter(Boolean)
  const experience   = (analysis.experience   || []).map(e =>
    typeof e === 'string' ? e : `${e.role || ''} at ${e.company || ''}`.trim()
  ).filter(Boolean)
  const projects     = (analysis.projects     || []).map(p =>
    typeof p === 'string' ? p : `${p.name || ''}: ${p.tech || p.description || ''}`.trim()
  ).filter(Boolean)
  const strengths    = (analysis.strengths    || analysis.keyStrengths || analysis.achievements || []).filter(Boolean)
  const targetRole   = analysis.targetRole   || 'Software Developer'
  const expLevel     = analysis.experienceLevel || analysis.difficultyLevel || 'Intermediate'

  // Compose the resume summary Gemini will use to personalise questions
  const resumeSummary = [
    `Target Role: ${targetRole}`,
    `Experience Level: ${expLevel}`,
    skills.length     ? `Core Skills: ${skills.slice(0, 15).join(', ')}`       : null,
    tools.length      ? `Tools & Technologies: ${tools.slice(0, 10).join(', ')}` : null,
    experience.length ? `Experience: ${experience.slice(0, 4).join(' | ')}`    : null,
    projects.length   ? `Projects: ${projects.slice(0, 3).join(' | ')}`        : null,
    strengths.length  ? `Key Strengths: ${strengths.slice(0, 4).join(', ')}`   : null,
  ].filter(Boolean).join('\n')

  console.log(`[API] Generating ${count} personalized ${category} questions for:\n${resumeSummary}`)

  // ── Tier 1: Gemini direct (fastest API) ──────────────────────────────────────
  try {
    const result = await GeminiService.generateQuestionsFromProfile(resumeSummary, category, count)
    if (result && result.length > 0) {
      console.log(`[API] ✅ Gemini returned ${result.length} personalized questions (${category})`)
      return { success: true, questions: result }
    }
  } catch (geminiErr) {
    console.warn('[API] Gemini question generation failed:', geminiErr.message)
  }

  // ── Tier 2: Backend /api/questions/generate ───────────────────────────────
  try {
    const data = await request('/questions/generate', {
      method: 'POST',
      body: JSON.stringify({ resumeData: analysis, category, count })
    })
    if (data.success && data.questions?.length > 0) {
      console.log(`[API] ✅ Backend returned ${data.questions.length} questions (${category})`)
      return { success: true, questions: data.questions }
    }
  } catch (backendErr) {
    console.warn('[API] Backend question generation failed:', backendErr.message)
  }

  // ── Tier 3: Static question bank (always works) ───────────────────────────
  console.warn('[API] Using static question bank as fallback')
  return {
    success: true,
    questions: getQuestionsByCategory(category).slice(0, count),
    isOfflineMode: true
  }
}

// ============================================
// Generate questions for ALL 4 categories at once
// ============================================
export async function generateAllCategoriesQuestions(analysis, count = 15) {
  try {
    // Try backend endpoint for all categories
    const data = await request('/questions/generate-all-categories', {
      method: 'POST',
      body: JSON.stringify({ resumeData: analysis, count })
    })
    if (data.success && data.allQuestions) {
      console.log('[API] ✅ All categories generated from backend:', data.summary)
      return { success: true, allQuestions: data.allQuestions, summary: data.summary }
    }
  } catch (backendErr) {
    console.warn('[API] Backend all-categories generation failed:', backendErr.message)
  }

  // Fallback: generate for each category individually
  try {
    const categories = ['Behavioral', 'Technical', 'Leadership', 'Product']
    const allQuestions = {}
    
    for (const category of categories) {
      const result = await generateQuestionsFromAnalysis(analysis, category, 15)
      allQuestions[category] = result.questions || getQuestionsByCategory(category).slice(0, 15)
    }

    console.log('[API] ✅ All categories generated individually')
    return {
      success: true,
      allQuestions,
      summary: {
        Behavioral: allQuestions.Behavioral?.length || 0,
        Technical: allQuestions.Technical?.length || 0,
        Leadership: allQuestions.Leadership?.length || 0,
        Product: allQuestions.Product?.length || 0,
      }
    }
  } catch (err) {
    console.error('[API] Failed to generate all categories:', err.message)
    // Fallback to static banks
    const allQuestions = {}
    ;['Behavioral', 'Technical', 'Leadership', 'Product'].forEach(cat => {
      allQuestions[cat] = getQuestionsByCategory(cat).slice(0, 15)
    })
    return { success: true, allQuestions, isOfflineMode: true }
  }
}

// ============================================
// Legacy: Generate questions (backward compatible)
// ============================================
export async function generateQuestions(resumeData, category, count = 5) {
  try {
    // Try backend first
    const data = await request('/questions/generate', {
      method: 'POST',
      body: JSON.stringify({ resumeData, category, count })
    })
    if (data.success && data.questions?.length > 0) {
      return data
    }
  } catch (err) {
    console.error('Backend question generation failed, trying Gemini:', err.message)
  }
  
  // Fallback to Gemini
  try {
    const questions = await GeminiService.generateQuestions(resumeData, category, count)
    return { success: true, questions }
  } catch (err) {
    console.error('Question generation error:', err)
    // Fallback to local questions
    return { 
      success: true, 
      questions: getQuestionsByCategory(category).slice(0, count),
      isOfflineMode: true 
    }
  }
}

// ============================================
// STEP 3: Analyze Interview Answer
// ============================================
export async function analyzeAnswer({ question, answer, category, resumeContext }) {
  try {
    // Try backend first
    const data = await request('/analyze', {
      method: 'POST',
      body: JSON.stringify({ question, answer, category, resumeContext })
    })
    
    if (data.success && data.analysis) {
      console.log('[API] Answer analyzed via backend:', data.analysis)
      return data
    }
  } catch (err) {
    console.error('[API] Backend answer analysis failed, trying Gemini:', err.message)
  }

  // Fallback to Gemini
  try {
    const feedback = await GeminiService.evaluateAnswer(question, answer, category || 'general')
    // Use heuristic to fill in any missing scores so we never default to 70
    const hScore = heuristicScore(answer)
    const analysis = {
      overallScore: feedback.overallScore ?? Math.round((feedback.score ?? (hScore / 10)) * 10),
      clarityScore: feedback.clarityScore ?? feedback.scoresBreakdown?.clarity ?? Math.max(0, hScore - 8),
      structureScore: feedback.structureScore ?? feedback.scoresBreakdown?.structure ?? Math.max(0, hScore - 12),
      confidenceScore: feedback.confidenceScore ?? feedback.scoresBreakdown?.confidence ?? Math.max(0, hScore - 5),
      relevanceScore: feedback.relevanceScore ?? feedback.scoresBreakdown?.relevance ?? Math.min(100, hScore + 3),
      englishScore: feedback.englishScore ?? feedback.scoresBreakdown?.content ?? Math.max(0, hScore - 3),
      fluencyScore: feedback.fluencyScore ?? Math.max(0, hScore - 10),
      strengths: feedback.strengths ?? (hScore >= 70 ? ['Addressed the question'] : []),
      improvements: feedback.improvements ?? feedback.areasForImprovement ?? getDefaultImprovements(answer),
      fillerWords: feedback.fillerWords ?? [],
      rewriteSuggestion: feedback.rewriteSuggestion ?? feedback.idealResponse ?? feedback.suggestions ?? getDefaultRewrite(hScore),
      followUpQuestion: feedback.followUpQuestion ?? 'Can you walk me through a specific example from your experience?',
      verdict: feedback.verdict ?? scoreToVerdict(hScore),
      shortSummary: feedback.shortSummary ?? feedback.suggestions ?? `Your answer scored ${hScore}/100. ${scoreToSummary(hScore)}`,
      isOfflineMode: true
    }
    return { success: true, analysis }
  } catch (err) {
    console.error('Answer analysis error:', err)
    // Last-resort fallback: use honest heuristic scoring
    const hScore = heuristicScore(answer)
    return {
      success: true,
      analysis: {
        overallScore: hScore,
        clarityScore: Math.max(0, hScore - 8),
        structureScore: Math.max(0, hScore - 12),
        confidenceScore: Math.max(0, hScore - 5),
        relevanceScore: Math.min(100, hScore + 3),
        englishScore: Math.max(0, hScore - 3),
        fluencyScore: Math.max(0, hScore - 10),
        strengths: hScore >= 70
          ? ['Addressed the core question', 'Provided some useful detail']
          : hScore >= 50
            ? ['Attempted to address the question']
            : [],
        improvements: getDefaultImprovements(answer),
        fillerWords: [],
        rewriteSuggestion: getDefaultRewrite(hScore),
        followUpQuestion: 'Can you walk me through a specific example from your experience?',
        verdict: scoreToVerdict(hScore),
        shortSummary: `Your answer scored ${hScore}/100. ${scoreToSummary(hScore)}`,
        isOfflineMode: true
      }
    }
  }
}

// ─── Heuristic scoring helpers ────────────────────────────────────────────────
function heuristicScore(answer) {
  const text = (answer || '').trim()
  const words = text.split(/\s+/).filter(Boolean)
  const wordCount = words.length

  // Base 0 — earn points for quality
  let score = 0

  // Word count scoring (primary) — starts from 0
  if (wordCount >= 150) score += 50
  else if (wordCount >= 100) score += 40
  else if (wordCount >= 70) score += 30
  else if (wordCount >= 40) score += 20
  else if (wordCount >= 20) score += 12
  else if (wordCount >= 10) score += 5
  // < 10 words — gets near zero

  // Quality bonuses (only if decent length)
  if (wordCount >= 50) {
    const hasMetrics = /\d+\s*(%|percent|times|days|hours|ms|seconds|million|thousand)/i.test(text)
    const hasActionVerbs = /\b(implemented|designed|developed|created|built|managed|optimized|resolved|analyzed|improved|led|launched|delivered)\b/i.test(text)
    const hasExamples = /\b(for example|for instance|such as|specifically|in particular|like when)\b/i.test(text)
    const hasStructure = /\b(situation|task|action|result|challenge|approach|outcome|first|second|finally|therefore)\b/i.test(text)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)

    if (hasMetrics) score += 20
    if (hasActionVerbs) score += 15
    if (hasExamples) score += 15
    if (hasStructure) score += 12
    if (sentences.length >= 4) score += 8
  }

  // Penalties for filler/vague language
  const fillerCount = (text.match(/\b(um|uh|like|you know|kind of|sort of|basically|i guess|hmm|er|uh)\b/gi) || []).length
  const vagueCount = (text.match(/\b(good|nice|stuff|things|something|whatever|kinda|gotta|wanna|gonna)\b/gi) || []).length
  if (fillerCount > 3) score -= 15
  else if (fillerCount > 1) score -= 8
  if (vagueCount > 3) score -= 12
  else if (vagueCount > 1) score -= 5

  // Final cap: 0-100 range
  return Math.min(100, Math.max(0, Math.round(score)))
}

function scoreToVerdict(score) {
  if (score >= 80) return 'Strong'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Average'
  return 'Weak'
}

function scoreToSummary(score) {
  if (score >= 80) return 'Strong response with good detail and structure.'
  if (score >= 60) return 'Decent answer, but needs more specifics and examples.'
  if (score >= 40) return 'Answer is too vague or brief. Add concrete examples and use the STAR method.'
  return 'Very weak answer — needs significant improvement with detail, structure, and examples.'
}

function getDefaultImprovements(answer) {
  const words = (answer || '').split(/\s+/).filter(Boolean).length
  const suggestions = []
  if (words < 70) suggestions.push('Expand your answer to at least 80-100 words with specific details')
  if (!/\d/.test(answer || '')) suggestions.push('Include quantifiable results (e.g., "increased by 30%", "reduced to 2 days")')
  if (!/\b(implemented|designed|built|created|managed|resolved)\b/i.test(answer || '')) suggestions.push('Use action verbs: implemented, designed, built, resolved, optimized')
  if (!/\b(situation|task|action|result|example|specifically)\b/i.test(answer || '')) suggestions.push('Structure using STAR: Situation → Task → Action → Result')
  if (suggestions.length === 0) suggestions.push('Add more specific metrics and measurable outcomes', 'Use more confident, action-oriented language')
  return suggestions
}

function getDefaultRewrite(score) {
  if (score < 40) return 'Provide a complete answer using the STAR method. Describe: (1) the specific Situation, (2) your Task/role, (3) the Actions you took, and (4) the measurable Results. Aim for 80-120 words with concrete details and numbers.'
  return 'Enhance your answer with specific metrics, quantifiable outcomes, and concrete examples. Use confident, action-oriented language and ensure each point builds logically toward a clear result.'
}

// ─── LocalStorage history helpers (fallback when backend is down) ──────────────
const LS_PREFIX = 'mockmate_session_history_'

function getStorageKey(userId) {
  return userId ? `${LS_PREFIX}${userId}` : LS_PREFIX
}

function lsSave(sessionData, userId) {
  try {
    const key = getStorageKey(userId || sessionData.userId)
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    existing.unshift({ ...sessionData, createdAt: new Date().toISOString() })
    if (existing.length > 100) existing.splice(100)
    localStorage.setItem(key, JSON.stringify(existing))
  } catch {}
}

function lsLoad(category, userId) {
  try {
    const key = getStorageKey(userId)
    const all = JSON.parse(localStorage.getItem(key) || '[]')
    if (category && category !== 'All') return all.filter(s => s.category === category)
    return all
  } catch { return [] }
}

// Save session — always persist to localStorage, try backend too
export async function saveSession(sessionData) {
  // 1. Always save locally so history works even offline
  lsSave(sessionData, sessionData.userId)
  // 2. Try backend (graceful fail)
  return request('/sessions', {
    method: 'POST',
    body: JSON.stringify(sessionData)
  }).catch(() => ({ success: false }))
}

// Get sessions — prefer backend, fall back to localStorage
export async function getSessions(userId, category, limit = 20) {
  const params = new URLSearchParams()
  if (userId) params.set('userId', userId)
  if (category && category !== 'All') params.set('category', category)
  params.set('limit', limit)
  try {
    const data = await request(`/sessions?${params}`)
    if (data.success && data.sessions?.length > 0) return data
    // Backend returned empty — augment with local storage (user-specific)
    const local = lsLoad(category, userId)
    return { success: true, sessions: local.slice(0, limit), _source: 'localStorage' }
  } catch {
    // Backend down — use localStorage (user-specific)
    const local = lsLoad(category, userId)
    return { success: true, sessions: local.slice(0, limit), _source: 'localStorage' }
  }
}

// ============================================
// STEP 4: Generate AI-Powered Ideal Answer
// ============================================
export async function generateIdealAnswer({ question, category, resumeContext, difficulty = 'medium' }) {
  try {
    console.log('[API] Generating ideal answer for:', question.substring(0, 50))
    const data = await request('/analyze/generate-answer', {
      method: 'POST',
      body: JSON.stringify({ question, category, resumeContext, difficulty })
    })
    
    if (data.success && data.result) {
      console.log('[API] ✅ Ideal answer generated via Gemini')
      return data
    }
  } catch (err) {
    console.error('[API] Failed to generate ideal answer:', err.message)
  }

  // Fallback: basic template
  return {
    success: true,
    result: {
      ideal_answer: 'A solid answer should follow the STAR method: (1) Situation - explain the context, (2) Task - describe your role, (3) Action - detail what you did, (4) Result - share the outcome with metrics. Aim for 150+ words with specific numbers and concrete examples.',
      structure_breakdown: {
        situation: 'What was the specific context or challenge?',
        task: 'What was your specific responsibility?',
        action: 'What concrete steps did you take?',
        result: 'What measurable outcomes did you achieve?'
      },
      key_points: ['Follow STAR method structure', 'Include specific metrics and outcomes', 'Use confident, action-oriented language', 'Provide concrete examples from real experience'],
      tips_for_delivery: ['Speak with confidence and conviction', 'Pause briefly between key points', 'Maintain steady eye contact', 'Avoid filler words like "um" and "like"']
    },
    _isOfflineMode: true
  }
}

// ============================================
// STEP 5: Generate Enhanced Personalized Questions
// ============================================
export async function generateEnhancedQuestions({ resumeData, category = 'Behavioral', count = 5 }) {
  try {
    console.log('[API] Generating enhanced personalized questions via backend')
    const data = await request('/analyze/generate-questions', {
      method: 'POST',
      body: JSON.stringify({ resumeData, category, count })
    })
    
    if (data.success && data.questions && data.questions.length > 0) {
      console.log('[API] ✅ Enhanced questions generated:', data.questions.length)
      return data
    }
  } catch (err) {
    console.warn('[API] Backend enhanced questions failed, falling back:', err.message)
  }

  // Fallback to existing question generation
  return generateQuestionsFromAnalysis(resumeData, category, count)
}


// Get stats
export async function getStats(userId) {
  const params = new URLSearchParams()
  if (userId) params.set('userId', userId)
  return request(`/sessions/stats?${params}`).catch(() => ({ 
    success: false, 
    stats: { totalSessions: 0, averageScore: 0, bestScore: 0, recentScore: 0, trend: [], byCategory: {} } 
  }))
}

// Health check
export async function checkHealth() {
  try {
    const res = await fetch(`${API_URL.replace('/api', '')}/health`)
    return res.ok
  } catch {
    return false
  }
}

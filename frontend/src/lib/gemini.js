/**
 * Gemini AI Service — OPTIMIZED (2 API Calls Only)
 *
 * CALL 1: analyzeResumeAndGenerateQuestions(resumeText, category, count)
 *   → returns { skills, experience, questions[] }
 *
 * CALL 2: evaluateAllAnswers(questionsAndAnswers[])
 *   → returns { overallScore, feedback, improvements, perAnswer[] }
 *
 * All other methods kept as lightweight fallbacks for backward compat.
 */

import keyManager from './geminiKeyManager'

const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-pro',
]
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const MAX_RETRIES = 25
let currentModelIndex = 0

class GeminiService {
  // ─────────────────────────────────────────────────────────────────
  // Core HTTP caller with key & model rotation
  // ─────────────────────────────────────────────────────────────────
  static async callGemini(prompt, retryCount = 0) {
    if (!keyManager.hasAvailableKeys()) {
      throw new Error('All Gemini API keys have been exhausted. Please check your API keys.')
    }

    const apiKey = keyManager.getCurrentKey()
    if (!apiKey) throw new Error('No valid Gemini API key available.')

    const model = GEMINI_MODELS[currentModelIndex]
    const apiUrl = `${GEMINI_BASE_URL}/${model}:generateContent`

    try {
      const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        }),
      })

      if (response.status === 401 || response.status === 403) {
        const error = await response.json()
        if (retryCount < MAX_RETRIES && keyManager.hasAvailableKeys()) {
          keyManager.rotateKey(error.error?.message || 'Auth failed')
          return this.callGemini(prompt, retryCount + 1)
        }
        throw new Error(error.error?.message || 'API Authentication failed')
      }

      if (response.status === 404) {
        if (currentModelIndex < GEMINI_MODELS.length - 1) {
          currentModelIndex++
          return this.callGemini(prompt, retryCount + 1)
        }
        throw new Error(`No supported Gemini model found. Tried: ${GEMINI_MODELS.join(', ')}`)
      }

      if (response.status === 429) {
        const error = await response.json()
        const msg = error.error?.message || 'Quota exceeded'
        console.warn(`[429] Key #${keyManager.currentKeyIndex + 1}, Model: ${model} — ${msg}`)
        if (retryCount < MAX_RETRIES) {
          if (keyManager.hasAvailableKeys()) {
            keyManager.rotateKey(msg)
            await new Promise(r => setTimeout(r, 500))
            return this.callGemini(prompt, retryCount + 1)
          }
          if (currentModelIndex < GEMINI_MODELS.length - 1) {
            currentModelIndex++
            keyManager.resetAllKeys()
            await new Promise(r => setTimeout(r, 500))
            return this.callGemini(prompt, retryCount + 1)
          }
        }
        throw new Error('All API keys and models quota-exhausted. Wait 24h or add billing.')
      }

      if (!response.ok) {
        const error = await response.json()
        const msg = error.error?.message || ''
        if ((msg.includes('not found') || msg.includes('not supported')) && currentModelIndex < GEMINI_MODELS.length - 1) {
          currentModelIndex++
          return this.callGemini(prompt, retryCount + 1)
        }
        throw new Error(msg || 'Gemini API error')
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('No response from Gemini API')

      console.log(`✅ Gemini OK — model: ${model}, key #${keyManager.currentKeyIndex + 1}`)
      keyManager.recordSuccess()
      return text
    } catch (error) {
      keyManager.recordError()
      if (
        (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota') || error.message.includes('rate')) &&
        retryCount < MAX_RETRIES && keyManager.hasAvailableKeys()
      ) {
        keyManager.rotateKey(error.message)
        await new Promise(r => setTimeout(r, 1000))
        return this.callGemini(prompt, retryCount + 1)
      }
      throw error
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 🔥 CALL 1 — Resume Analysis + Question Generation (merged)
  // Replaces: analyzeResume() + generateQuestions()
  // ─────────────────────────────────────────────────────────────────
  static async analyzeResumeAndGenerateQuestions(resumeText, category = 'Behavioral', count = 5) {
    const prompt = `You are an expert recruiter and technical interviewer. Analyze this resume and generate ${count} interview questions for a ${category} interview.

Resume:
${resumeText.substring(0, 6000)}

Return ONLY valid JSON (no markdown, no extra text):
{
  "profile": {
    "name": "candidate name or null",
    "targetRole": "inferred target role",
    "skills": ["skill1", "skill2"],
    "tools": ["tool1"],
    "experience": ["role at company (dates)"],
    "strengths": ["strength1"],
    "difficultyLevel": "Beginner|Intermediate|Advanced"
  },
  "questions": [
    {
      "id": "q1",
      "question": "Question text",
      "category": "${category}",
      "difficulty": "easy|medium|hard",
      "hint": "Brief hint for strong answer"
    }
  ]
}`

    try {
      const response = await this.callGemini(prompt)
      const cleaned = response.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')
      const result = JSON.parse(jsonMatch[0])
      return {
        profile: result.profile || {},
        questions: result.questions || [],
      }
    } catch (error) {
      console.error('analyzeResumeAndGenerateQuestions error:', error)
      throw new Error('Failed to analyze resume and generate questions')
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 🎯 generateQuestionsFromProfile — DEDICATED question-only prompt
  // Uses a pre-built resume summary to generate category-specific
  // personalized questions. Called by generateQuestionsFromAnalysis().
  // ─────────────────────────────────────────────────────────────────
  static async generateQuestionsFromProfile(resumeSummary, category = 'Behavioral', count = 5) {
    const categoryGuidance = {
      Behavioral: 'STAR-method situational questions tied specifically to their experience, tools, and projects from the resume above',
      Technical:  'Deep technical questions about the specific skills, tools, languages, and projects listed in the resume above — avoid generic questions',
      Leadership: 'Questions about driving impact, team decisions, conflict resolution, and ownership — grounded in their actual experience',
      Product:    'Product thinking questions about real scenarios they may have faced given their background — prioritization, metrics, user empathy',
    }
    const focus = categoryGuidance[category] || categoryGuidance.Behavioral

    const prompt = `You are a senior interviewer at a top tech company.

Based on this candidate's resume profile, generate exactly ${count} personalized ${category} interview questions.

CANDIDATE PROFILE:
${resumeSummary}

CATEGORY FOCUS — ${category}:
${focus}

STRICT RULES:
- Every question MUST reference or be directly relevant to the candidate's specific background above
- Do NOT generate generic textbook questions (e.g., "Tell me about a time you worked in a team")
- Vary difficulty: include Easy, Medium, and Hard questions
- Make questions specific enough that only THIS candidate's experience could answer them well
- Each question should feel like it came from an interviewer who read their resume carefully

Return ONLY a valid JSON array (no markdown, no preamble):
[
  {
    "id": "q1",
    "question": "Specific personalized question referencing their actual background",
    "category": "${category}",
    "difficulty": "easy|medium|hard",
    "hint": "What a strong answer would include for this specific question",
    "followUp": "Natural follow-up the interviewer would ask"
  }
]`

    try {
      const response = await this.callGemini(prompt)
      const cleaned = response.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim()
      // Match JSON array
      const arrMatch = cleaned.match(/\[[\s\S]*\]/)
      if (!arrMatch) throw new Error('No JSON array in response')
      const questions = JSON.parse(arrMatch[0])
      if (!Array.isArray(questions) || questions.length === 0) throw new Error('Empty questions array')
      console.log(`✅ generateQuestionsFromProfile: ${questions.length} questions for ${category}`)
      return questions
    } catch (error) {
      console.error('generateQuestionsFromProfile error:', error.message)
      throw error // Let caller handle fallback
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 🔥 CALL 2 — Evaluate ALL Answers at once (merged)
  // Replaces: evaluateAnswer() called N times
  // ─────────────────────────────────────────────────────────────────
  static async evaluateAllAnswers(questionsAndAnswers) {
    const qaBlock = questionsAndAnswers.map((qa, i) =>
      `Q${i + 1} (${qa.category || 'General'}): ${qa.question}\nAnswer: "${qa.answer}"`
    ).join('\n\n');

    // ══════════════════════════════════════════════════════════════════════════
    // 🔥 MASTER PROMPT — Non-repetitive, variable scoring, human-like feedback
    // ══════════════════════════════════════════════════════════════════════════
    const prompt = `You are an advanced AI Interview Evaluator.

Evaluate each of the ${questionsAndAnswers.length} interview answer(s) below.

For EACH answer:
1. Analyze the content deeply and uniquely
2. Score based on multiple dimensions (0-10 each)
3. Vary scores based on actual answer quality — DO NOT default to the same values

--------------------------
ANSWERS TO EVALUATE:

${qaBlock}

--------------------------
SCORING RULES (STRICTLY FOLLOW — apply per answer):

- VERY STRONG answer (detailed, specific, structured, confident) -> overall_score: 8-10
- AVERAGE answer (addresses question but lacks depth or examples) -> overall_score: 5-7
- WEAK answer (vague, too short, off-topic, or incorrect) -> overall_score: 0-4

Penalize appropriately per answer:
- Under 30 words -> depth: 1-3
- Vague or filler phrases -> lower clarity
- Factually wrong -> lower technical_accuracy
- No structure -> lower structure

--------------------------
OUTPUT (strict JSON, no markdown):

{
  "sessionScore": 75,
  "sessionVerdict": "Good",
  "sessionFeedback": "2-3 sentence overall session summary",
  "improvements": ["session-level improvement 1", "session-level improvement 2"],
  "strengths": ["session-level strength 1", "session-level strength 2"],
  "answers": [
    {
      "questionIndex": 0,
      "overall_score": 7,
      "rating": "Good",
      "breakdown": {
        "relevance": 8,
        "clarity": 7,
        "depth": 6,
        "structure": 7,
        "technical_accuracy": 7
      },
      "overallScore": 70,
      "clarityScore": 70,
      "structureScore": 70,
      "confidenceScore": 68,
      "relevanceScore": 80,
      "englishScore": 72,
      "fluencyScore": 65,
      "verdict": "Good",
      "strengths": ["Specific strength for this answer"],
      "weaknesses": ["Specific weakness for this answer"],
      "improvements": ["Specific actionable suggestion for this answer"],
      "rewriteSuggestion": "A polished rewrite of this specific answer",
      "followUpQuestion": "A challenging follow-up for this specific answer",
      "shortSummary": "2 sentence summary of this answer's performance",
      "fillerWords": []
    }
  ]
}`;

    try {
      const response = await this.callGemini(prompt)
      const cleaned = response.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')
      const result = JSON.parse(jsonMatch[0])

      // Normalize each answer: convert 0-10 scores to 0-100 if needed
      if (result.answers) {
        result.answers = result.answers.map(ans => {
          if (ans.overall_score !== undefined && ans.overallScore === undefined) {
            const s = ans.overall_score
            const bd = ans.breakdown || {}
            ans.overallScore    = Math.round(s * 10)
            ans.clarityScore    = Math.round((bd.clarity    !== undefined ? bd.clarity    : s) * 10)
            ans.structureScore  = Math.round((bd.structure  !== undefined ? bd.structure  : s) * 10)
            ans.relevanceScore  = Math.round((bd.relevance  !== undefined ? bd.relevance  : s) * 10)
            ans.confidenceScore = ans.confidenceScore !== undefined ? ans.confidenceScore : Math.round(s * 10)
            ans.englishScore    = ans.englishScore    !== undefined ? ans.englishScore    : Math.round(s * 10)
            ans.fluencyScore    = ans.fluencyScore    !== undefined ? ans.fluencyScore    : Math.round(s * 10)
          }
          if (!ans.verdict && ans.rating) {
            const map = { Excellent: 'Strong', Good: 'Good', Average: 'Average', Weak: 'Weak' }
            ans.verdict = map[ans.rating] || 'Average'
          }
          if ((!ans.improvements || ans.improvements.length === 0) && ans.weaknesses?.length) {
            ans.improvements = ans.weaknesses
          }
          return ans
        })
      }

      return result
    } catch (error) {
      console.error('evaluateAllAnswers error:', error)
      throw new Error('Failed to evaluate answers')
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Legacy: Single answer evaluation (backward compat for PracticePage)
  // ─────────────────────────────────────────────────────────────────
  static async evaluateAnswer(question, userAnswer, questionCategory) {
    // Delegate to the batch evaluator with a single-item array
    try {
      const result = await this.evaluateAllAnswers([
        { question, answer: userAnswer, category: questionCategory }
      ])
      const ans = result.answers?.[0] || {}
      return {
        overallScore:    ans.overallScore    ?? result.sessionScore ?? 70,
        clarityScore:    ans.clarityScore    ?? 70,
        structureScore:  ans.structureScore  ?? 70,
        confidenceScore: ans.confidenceScore ?? 70,
        relevanceScore:  ans.relevanceScore  ?? 70,
        englishScore:    ans.englishScore    ?? 70,
        fluencyScore:    ans.fluencyScore    ?? 70,
        strengths:       ans.strengths       ?? result.strengths ?? [],
        improvements:    ans.improvements    ?? result.improvements ?? [],
        fillerWords:     ans.fillerWords     ?? [],
        rewriteSuggestion: ans.rewriteSuggestion ?? '',
        followUpQuestion:  ans.followUpQuestion  ?? '',
        verdict:         ans.verdict         ?? result.sessionVerdict ?? 'Average',
        shortSummary:    ans.shortSummary    ?? result.sessionFeedback ?? '',
      }
    } catch (error) {
      console.error('evaluateAnswer error:', error)
      throw error
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Legacy: analyzeResume (backward compat — uses Call 1 internally)
  // ─────────────────────────────────────────────────────────────────
  static async analyzeResume(resumeText) {
    try {
      const result = await this.analyzeResumeAndGenerateQuestions(resumeText, 'Behavioral', 1)
      return result.profile
    } catch (error) {
      throw new Error('Failed to analyze resume')
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Legacy: generateQuestions (backward compat — uses Call 1 internally)
  // ─────────────────────────────────────────────────────────────────
  static async generateQuestions(resumeAnalysis, categoryPreference = 'general', count = 5) {
    const fakeResume = `
Role: ${resumeAnalysis.targetRole || 'Software Developer'}
Skills: ${(resumeAnalysis.skills || []).join(', ')}
Tools: ${(resumeAnalysis.tools || []).join(', ')}
Experience: ${(resumeAnalysis.experience || []).join(', ')}
    `.trim()

    const result = await this.analyzeResumeAndGenerateQuestions(fakeResume, categoryPreference, count)
    return result.questions
  }

  // ─────────────────────────────────────────────────────────────────
  // Key manager helpers
  // ─────────────────────────────────────────────────────────────────
  static getApiStats()       { return keyManager.getStats() }
  static resetApiKey(i)      { keyManager.resetKey(i) }
  static resetAllApiKeys()   { keyManager.resetAllKeys() }
  static getTotalRequests()  { return keyManager.getTotalRequests() }
  static getTotalErrors()    { return keyManager.getTotalErrors() }
  static isReady()           { return keyManager.hasAvailableKeys() }
}

export default GeminiService

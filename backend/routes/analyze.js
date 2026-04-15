const express = require('express');
const router = express.Router();

// Use environment variable for API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_KEY_FALLBACK = process.env.GEMINI_API_KEY_FALLBACK;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not set in environment variables');
} else {
  console.log('✅ GEMINI_API_KEY is configured');
}

if (GEMINI_API_KEY_FALLBACK) {
  console.log('✅ GEMINI_API_KEY_FALLBACK is configured (backup key available)');
}

// ─── IMPROVED Heuristic Classifier: Fair scoring for all answer types ────────
function classifyAnswerQuality(answer) {
  const text = (answer || '').trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  
  // Detect poor quality indicators
  const isVeryShort = wordCount < 25;
  const isTooShort = wordCount < 50;
  const isExtremelyShorty = wordCount < 15;
  
  // Count filler words and vague language
  const fillerPattern = /\b(um|uh|like|you know|kind of|sort of|basically|i think|i guess|may be|well|aah|so|uh|hmm|er|err)\b/gi;
  const fillerMatches = text.match(fillerPattern) || [];
  const fillerRatio = fillerMatches.length / Math.max(wordCount, 1);
  
  // Vague and non-committal words
  const vaguePattern = /\b(good|nice|stuff|things|something|whatever|kinda|gotta|wanna|gonna|just)\b/gi;
  const vagueMatches = text.match(vaguePattern) || [];
  const vagueRatio = vagueMatches.length / Math.max(wordCount, 1);
  
  // Positive indicators
  const hasNumbers = /\d+/.test(text);
  const hasAcronyms = /\b(STAR|API|SQL|REST|CI|CD|OOP|AWS|GCP|AI|ML|React|Node|Docker|K8s|HTTP|REST|JSON|XML)\b/i.test(text);
  const hasSpecificExamples = /\b(example|for instance|such as|like when|specifically)\b/i.test(text);
  const hasMetrics = /\d+\s*(%|percent|times|days|hours|seconds|ms|kb|gb|million|thousand|hundred)\b/i.test(text);
  const hasActionVerbs = /\b(implemented|designed|developed|created|built|managed|optimized|resolved|analyzed|evaluated|led|drove|achieved)\b/i.test(text);
  
  // Structure quality
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  
  // Poor structure indicators
  const hasRunOn = avgSentenceLength > 40;
  const hasFragments = /^\s*([A-Z][a-z].*?)\s*$/.test(text) && sentenceCount === 1;
  
  // ✅ IMPROVED SCORING - More fair and balanced
  // Start with 50 base (neutral) instead of 20 (harsh)
  let score = 50;
  
  // MODERATE PENALTIES - Don't penalize short correct answers too heavily
  if (isExtremelyShorty) {
    score -= 10; // < 15 words = basic but acceptable
  } else if (isVeryShort) {
    score -= 5;  // < 25 words = acceptable but could be better
  } else if (isTooShort) {
    score -= 2;  // < 50 words = marginal penalty
  }
  
  // Filler penalties
  if (fillerRatio > 0.30) score -= 15; // Excessive fillers
  else if (fillerRatio > 0.15) score -= 8; 
  
  // Vague language penalties
  if (vagueRatio > 0.30) score -= 20; // Excessive vague language
  else if (vagueRatio > 0.20) score -= 10;
  
  // Structure penalties
  if (hasFragments || sentenceCount === 0) score -= 15; // No structure
  else if (hasRunOn && sentenceCount < 2) score -= 8; // Poor structure
  
  // ✅ IMPROVED BONUSES - Reward good content regardless of length
  // Quality indicators (apply for all lengths)
  if (hasMetrics) score += 15; // Metrics are important
  if (hasAcronyms) score += 8;
  if (hasActionVerbs) score += 10; // Strong action verbs
  if (hasSpecificExamples) score += 12;
  if (hasNumbers) score += 8; // Any quantifiable info
  
  // Length-based bonuses (still reward longer answers but not required)
  if (wordCount >= 150) score += 15;
  else if (wordCount >= 100) score += 10;
  else if (wordCount >= 50) score += 5;
  
  // Structure bonus
  if (sentenceCount >= 3 && avgSentenceLength > 12 && avgSentenceLength < 35) score += 12;
  
  // Clamp to 0-100
  return Math.min(100, Math.max(0, score));
}

// ─── Detailed Feedback Generator: Identifies specific issues ──────────────────
function generateDetailedFeedback(answer) {
  const text = (answer || '').trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  
  const issues = [];
  const strengths = [];
  const suggestions = [];
  
  // Detect issues
  if (wordCount < 20) {
    issues.push('❌ Answer is too short (only ' + wordCount + ' words) — need at least 70+ words for adequate detail');
    suggestions.push('Expand your answer with specific details, examples, and outcomes');
  } else if (wordCount < 50) {
    issues.push('⚠️ Answer lacks sufficient detail (' + wordCount + ' words) — should be 70+ words');
    suggestions.push('Add concrete examples, metrics, or more specific information');
  }
  
  if (sentenceCount < 2) {
    issues.push('❌ Answer has no clear structure — provide at least 2-3 distinct thoughts');
    suggestions.push('Break your response into clear, separate sentences and ideas');
  }
  
  const fillerPattern = /\b(um|uh|like|you know|kind of|sort of|basically|i think|i guess|well|hmm)\b/gi;
  const fillerMatches = text.match(fillerPattern) || [];
  if (fillerMatches.length > 2) {
    issues.push('❌ Too many filler words (' + fillerMatches.join(', ') + ') — removes credibility');
    suggestions.push('Eliminate filler words like "um", "like", "basically" for more confident delivery');
  }
  
  const vaguePattern = /\b(good|nice|stuff|things|something|whatever|kinda|gotta|wanna)\b/gi;
  const vagueMatches = text.match(vaguePattern) || [];
  if (vagueMatches.length > 2) {
    issues.push('❌ Vague language detected (' + vagueMatches.slice(0, 3).join(', ') + ') — be specific');
    suggestions.push('Replace vague words with concrete, specific terms and examples');
  }
  
  const hasNumbers = /\d+/.test(text);
  const hasMetrics = /\d+\s*(%|percent|times|days|hours|completed|reduced|improved|increased)/i.test(text);
  if (!hasNumbers && !hasMetrics) {
    issues.push('❌ No quantifiable results or metrics — always include numbers/outcomes');
    suggestions.push('Add specific numbers, percentages, or measurable results (e.g., "increased by 25%", "completed in 3 weeks")');
  }
  
  const hasActionVerbs = /\b(implemented|designed|developed|created|built|managed|optimized|resolved|analyzed|improved)\b/i.test(text);
  if (!hasActionVerbs) {
    issues.push('❌ No action-oriented language — use strong verbs');
    suggestions.push('Use action verbs like "implemented", "designed", "resolved", "optimized" to show impact');
  }
  
  const hasSTAR = /(situation|task|action|result|challenge|approach|outcome)/i.test(text);
  if (!hasSTAR && wordCount < 100) {
    issues.push('❌ Missing STAR method structure (Situation → Task → Action → Result)');
    suggestions.push('Structure using STAR: What was the situation? What did you do? What was the result?');
  }
  
  if (wordCount > 100) {
    strengths.push('✅ Adequate length and detail provided');
  }
  if (hasMetrics) {
    strengths.push('✅ Includes quantifiable outcomes/metrics');
  }
  if (hasActionVerbs) {
    strengths.push('✅ Uses action-oriented language');
  }
  
  return { issues, strengths, suggestions };
}

// ─── Gemini API caller with retry and fallback ────────────────────────────────
async function callGeminiAPI(prompt, retryCount = 0, usesFallback = false) {
  if (retryCount >= 3) {
    throw new Error('Gemini API failed after 3 retries');
  }

  const apiKey = usesFallback ? GEMINI_API_KEY_FALLBACK : GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('No valid Gemini API key available');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const keyLabel = usesFallback ? '(FALLBACK)' : '';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        }
      })
    });

    if (response.status === 401 || response.status === 403) {
      console.error(`[Gemini] API key error ${keyLabel}: ${response.status}`);
      
      // If primary key failed and fallback is available, try fallback
      if (!usesFallback && GEMINI_API_KEY_FALLBACK) {
        console.log('[Gemini] Switching to fallback API key...');
        return callGeminiAPI(prompt, 0, true);
      }
      
      throw new Error('Invalid or expired API key');
    }

    if (response.status === 429) {
      const error = await response.json();
      console.error(`[Gemini] Quota exceeded ${keyLabel}:`, error.error?.message);
      
      // If primary key hit quota and fallback is available, try fallback
      if (!usesFallback && GEMINI_API_KEY_FALLBACK) {
        console.log('[Gemini] Primary quota exceeded, switching to fallback API key...');
        return callGeminiAPI(prompt, 0, true);
      }
      
      throw new Error(error.error?.message || 'Quota exceeded');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API call failed');
    }

    const data = await response.json();
    if (usesFallback) {
      console.log('[Gemini] ✅ Fallback key successful!');
    }
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error(`[Gemini] Error (attempt ${retryCount + 1}) ${keyLabel}:`, err.message);
    if (retryCount < 2) {
      await new Promise(r => setTimeout(r, 1000));
      return callGeminiAPI(prompt, retryCount + 1, usesFallback);
    }
    throw err;
  }
}

// ─── POST /api/analyze/resume ─────────────────────────────────────────────────
router.post('/resume', async (req, res) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text is required' });
    }
    if (resumeText.trim().length < 100) {
      return res.status(400).json({ error: 'Resume text is too short. Please provide a complete resume.' });
    }

    const prompt = `You are a professional recruiter and career coach. Analyze this resume and extract structured information. Return ONLY valid JSON, no markdown.

Resume:
${resumeText.substring(0, 8000)}

Return EXACTLY this JSON structure:
{
  "skills": ["skill1", "skill2", "skill3"],
  "technologies": ["tech1", "tech2"],
  "languages": ["language1"],
  "frameworks": ["framework1"],
  "experienceLevel": "junior|mid|senior",
  "targetRole": "inferred job target from resume",
  "yearsOfExperience": 0,
  "keyStrengths": ["strength1", "strength2"],
  "areasForGrowth": ["area1", "area2"],
  "projects": [{"name": "project", "tech": "technologies used"}],
  "summary": "2-3 sentence professional summary"
}`;

    const responseText = await callGeminiAPI(prompt);
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse resume structure');

    const analysis = JSON.parse(jsonMatch[0]);
    console.log('[Resume Analysis] Success:', {
      skills: analysis.skills?.length || 0,
      targetRole: analysis.targetRole
    });
    res.json({ success: true, analysis });

  } catch (err) {
    console.error('[Resume Analysis Error]', err.message);
    res.status(500).json({ error: 'Failed to analyze resume: ' + err.message });
  }
});

// ─── POST /api/analyze — Master Prompt evaluation ─────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { question, answer, category, resumeContext } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }
    if (answer.trim().length < 20) {
      return res.status(400).json({ error: 'Answer is too short to analyze. Please provide a more complete response.' });
    }

    console.log(`[Analyze] Processing: Q="${question.substring(0, 50)}..." | A_len=${answer.trim().length} | Category="${category}"`);

    const resumeCtx = resumeContext
      ? `\nCandidate Background: ${JSON.stringify(resumeContext).substring(0, 1000)}`
      : '';

    // ══════════════════════════════════════════════════════════════════════════
    // 🔥 MASTER PROMPT — Production-grade evaluation with fair scoring
    // ══════════════════════════════════════════════════════════════════════════
    const prompt = `You are an advanced AI Interview Evaluator trained by top tech companies.

Your job is to:
1. Analyze the candidate's answer deeply and fairly
2. Score it based on QUALITY and RELEVANCE, not just length
3. Provide detailed, structured, and actionable feedback
4. Ensure scores reflect actual answer quality

--------------------------
INPUT:
Question (${category || 'General'}): ${question}
${resumeCtx}

Candidate Answer:
"${answer}"

--------------------------
SCORING PHILOSOPHY:

⚠️ IMPORTANT: Do NOT penalize length alone. A short, relevant, well-structured answer should NOT score low.
✅ Score based on: Relevance, Clarity, Depth of insight, Structure, and Technical accuracy.
✅ A 40-word answer that directly answers the question and shows understanding should score 7-8/10.
❌ A 200-word rambling answer with filler should score 4-5/10.

--------------------------
EVALUATION CRITERIA:

Score each dimension on 0-10 scale:
- relevance (Does it answer what was asked?): 0-10
- clarity (Is it easy to understand? Well-articulated?): 0-10
- depth (Level of insight, examples, and knowledge shown): 0-10
- structure (Logical flow, organized, STAR-like if applicable): 0-10
- technical_accuracy (Correct facts and domain knowledge): 0-10

OVERALL_SCORE GUIDANCE:
- 9-10: Excellent — Clear, specific, well-structured, shows mastery
- 7-8: Good — Addresses question well, decent detail, confident delivery
- 5-6: Average — Answers the question but lacks specific examples or depth
- 3-4: Weak — Vague, off-topic, or missing key points
- 0-2: Poor — Doesn't answer the question or is unintelligible

--------------------------
SCORING RULES (STRICTLY FOLLOW):

1. Relevance is PRIMARY. If it doesn't answer the question, score low regardless of length.
2. A focused, short answer that directly addresses the question > Long rambling answer.
3. Penalize vague language: "good", "nice", "stuff", "things" → lower clarity
4. Bonus for specific examples, metrics, or concrete details → higher depth
5. Bonus for strong action verbs: "implemented", "resolved", "designed" → higher structure
6. Bonus for quantifiable results: percentages, numbers, outcomes → higher technical_accuracy
7. If answer is under 20 words AND vague → can score 3-5/10
8. If answer is under 20 words BUT specific and correct → can score 6-7/10

--------------------------
OUTPUT FORMAT (STRICT JSON - no markdown, no extra text):

{
  "overall_score": 7,
  "rating": "Good",
  "breakdown": {
    "relevance": 8,
    "clarity": 7,
    "depth": 6,
    "structure": 7,
    "technical_accuracy": 7
  },
  "strengths": [
    "Specific strength observed in this answer",
    "Another concrete strength"
  ],
  "weaknesses": [
    "Specific weakness observed in this answer",
    "Another concrete weakness"
  ],
  "improvements": [
    "Specific actionable suggestion tailored to this answer",
    "Another specific suggestion"
  ],
  "feedback_summary": "2-3 sentence human-like summary of performance",
  "overallScore": 70,
  "clarityScore": 70,
  "structureScore": 70,
  "confidenceScore": 68,
  "relevanceScore": 80,
  "englishScore": 72,
  "fluencyScore": 65,
  "fillerWords": ["um", "like"],
  "rewriteSuggestion": "A polished complete rewrite demonstrating ideal structure and depth",
  "followUpQuestion": "A challenging follow-up an interviewer would ask",
  "verdict": "Good",
  "shortSummary": "2-3 sentence human-like summary of performance"
}`;

    console.log('[Analyze] Calling Gemini API...');
    const responseText = await callGeminiAPI(prompt);
    console.log('[Analyze] ✅ Gemini API response received');

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Analyze] No JSON found in response:', responseText.substring(0, 200));
      throw new Error('Failed to generate valid analysis');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // ── Normalize: if AI returned overall_score (0-10), fill in 0-100 fields ──
    if (analysis.overall_score !== undefined && analysis.overallScore === undefined) {
      const s10 = analysis.overall_score;
      const bd  = analysis.breakdown || {};
      analysis.overallScore    = Math.round(s10 * 10);
      analysis.clarityScore    = Math.round((bd.clarity    !== undefined ? bd.clarity    : s10) * 10);
      analysis.structureScore  = Math.round((bd.structure  !== undefined ? bd.structure  : s10) * 10);
      analysis.relevanceScore  = Math.round((bd.relevance  !== undefined ? bd.relevance  : s10) * 10);
      analysis.confidenceScore = analysis.confidenceScore !== undefined ? analysis.confidenceScore : Math.round(s10 * 10);
      analysis.englishScore    = analysis.englishScore    !== undefined ? analysis.englishScore    : Math.round(s10 * 10);
      analysis.fluencyScore    = analysis.fluencyScore    !== undefined ? analysis.fluencyScore    : Math.round(s10 * 10);
    }

    // ── Map rating -> verdict ──
    if (!analysis.verdict && analysis.rating) {
      const map = { Excellent: 'Strong', Good: 'Good', Average: 'Average', Weak: 'Weak' };
      analysis.verdict = map[analysis.rating] || 'Average';
    }

    // ── Merge weaknesses into improvements ──
    if ((!analysis.improvements || analysis.improvements.length === 0) && analysis.weaknesses && analysis.weaknesses.length > 0) {
      analysis.improvements = analysis.weaknesses;
    }

    // ── Fill shortSummary from feedback_summary ──
    if (!analysis.shortSummary && analysis.feedback_summary) {
      analysis.shortSummary = analysis.feedback_summary;
    }

    // ── Validate required numeric fields: fill with heuristic if missing ──
    const heuristicBase = classifyAnswerQuality(req.body.answer || '');
    const fieldDefaults = {
      overallScore:    heuristicBase,
      clarityScore:    Math.max(0, heuristicBase - 8),
      structureScore:  Math.max(0, heuristicBase - 12),
      confidenceScore: Math.max(0, heuristicBase - 5),
      relevanceScore:  Math.min(100, heuristicBase + 3),
      englishScore:    Math.max(0, heuristicBase - 3),
      fluencyScore:    Math.max(0, heuristicBase - 10),
    };
    const numericFields = ['overallScore', 'clarityScore', 'structureScore', 'confidenceScore', 'relevanceScore', 'englishScore', 'fluencyScore'];
    for (const field of numericFields) {
      if (analysis[field] === undefined) {
        console.warn(`[Analyze] Missing field: ${field}, using heuristic: ${fieldDefaults[field]}`);
        analysis[field] = fieldDefaults[field];
      }
    }
    if (!Array.isArray(analysis.strengths))    analysis.strengths    = [];
    if (!Array.isArray(analysis.improvements)) analysis.improvements = [];

    console.log(`[Analyze] Score: ${analysis.overallScore}/100 | Verdict: ${analysis.verdict}`);
    res.json({ success: true, analysis });

  } catch (err) {
    console.error('[Analyze Error]', err.message);
    console.error('[Analyze] Using heuristic fallback — Gemini API unavailable');

    // ── Smart fallback: heuristic classifier for variable scores ──
    const answerText  = req.body.answer || '';
    const base100     = classifyAnswerQuality(answerText); // Now returns 0-100 directly
    
    console.log(`[Analyze FALLBACK] Heuristic score: ${base100}/100 | Answer length: ${answerText.trim().length} words`);

    // Map score to rating and verdict based on quality thresholds
    let rating, verdict, summaryMsg;
    
    if (base100 >= 85) {
      rating = 'Excellent';
      verdict = 'Strong';
      summaryMsg = 'Strong delivery with clear structure and specific examples.';
    } else if (base100 >= 70) {
      rating = 'Good';
      verdict = 'Good';
      summaryMsg = 'Good attempt with decent detail. Add more specific metrics and examples to strengthen further.';
    } else if (base100 >= 50) {
      rating = 'Average';
      verdict = 'Average';
      summaryMsg = 'Average response that addresses the question but could use more depth. Add concrete examples and use the STAR method.';
    } else if (base100 >= 30) {
      rating = 'Weak';
      verdict = 'Weak';
      summaryMsg = 'Weak answer — needs more substance, detail, and structure. Consider using the STAR method for better organization.';
    } else {
      rating = 'Poor';
      verdict = 'Weak';
      summaryMsg = 'Answer lacks sufficient content and detail. Please provide a more complete response with specific examples and outcomes.';
    }
    
    console.log(`[Analyze FALLBACK] Rating: ${rating} | Verdict: ${verdict}`);

    // Generate detailed feedback
    const { issues, strengths: detectedStrengths, suggestions: detailedSuggestions } = generateDetailedFeedback(answerText);
    console.log(`[Analyze FALLBACK] Issues detected: ${issues.length}, Strengths: ${detectedStrengths.length}`);

    // Deterministic variation within +/- 5 points for related metrics
    const seedHash = answerText.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const vary = (offset) => Math.min(100, Math.max(0, base100 + offset + (seedHash % 5) - 2));

    res.json({
      success: true,
      analysis: {
        overallScore:    base100,
        clarityScore:    vary(-8),
        structureScore:  vary(-12),
        confidenceScore: vary(-5),
        relevanceScore:  vary(+3),
        englishScore:    vary(-3),
        fluencyScore:    vary(-10),
        overall_score:   Math.round(base100 / 10),  // 0-10 scale for breakdown
        rating,
        breakdown: {
          relevance:          Math.round(base100 / 10),
          clarity:            Math.max(0, Math.round(base100 / 10) - 1),
          depth:              Math.max(0, Math.round(base100 / 10) - 2),
          structure:          Math.max(0, Math.round(base100 / 10) - 1),
          technical_accuracy: Math.round(base100 / 10),
        },
        strengths:         detectedStrengths.length > 0 ? detectedStrengths : 
          (base100 >= 70
            ? ['Addressed the core question', 'Maintained good topic focus', 'Showed structured thinking']
            : base100 >= 50
              ? ['Attempted to address the question']
              : ['Answer needs improvement']),
        weaknesses:        issues.length > 0 ? issues :
          (base100 < 60
            ? ['Lacks sufficient detail and examples', 'Answer is too brief or vague', 'Missing structured approach like STAR method']
            : base100 < 75
              ? ['Could benefit from specific metrics or outcomes', 'Structure could be slightly improved']
              : []),
        improvements:      detailedSuggestions.length > 0 ? detailedSuggestions : [
          'Use the STAR method: Situation → Task → Action → Result',
          'Include concrete numbers, percentages, or quantifiable outcomes',
          'Structure your answer with 3-4 well-developed sentences minimum',
          'Demonstrate specific technical knowledge or problem-solving approach',
        ],
        fillerWords:       [],
        rewriteSuggestion: base100 < 50
          ? 'Provide a complete answer following the STAR method. Describe the specific situation, your role, the actions you took, and the measurable results. Aim for 100+ words with concrete details.'
          : 'Enhance with specific metrics, quantifiable outcomes, and concrete examples. Use confident, action-oriented language and ensure each point builds logically.',
        followUpQuestion:  'Can you walk me through another situation where you faced a similar challenge with different constraints or outcomes?',
        verdict,
        shortSummary:      `Your answer scored ${base100}/100. ${summaryMsg}`,
        feedback_summary:  `Your answer scored ${base100}/100. ${summaryMsg}`,
        _note: 'Heuristic fallback mode — Gemini AI evaluation unavailable',
      }
    });
  }
});

// ─── POST /api/analyze/generate-answer — AI-powered ideal answer generation ────
router.post('/generate-answer', async (req, res) => {
  try {
    const { question, category, resumeContext, difficulty } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log(`[Generate Answer] Q="${question.substring(0, 50)}..." | Category="${category}" | Difficulty="${difficulty}"`);

    const resumeCtx = resumeContext
      ? `\nCandidate Background: ${JSON.stringify(resumeContext).substring(0, 800)}`
      : '';

    const difficultyGuidance = {
      easy: 'Provide a clear, straightforward answer 60-80 words with basic structure.',
      medium: 'Provide a detailed answer 100-150 words using the STAR method with specific examples.',
      hard: 'Provide an in-depth answer 150-200+ words using the STAR method with metrics, quantifiable results, and strategic insights.'
    };

    // ══════════════════════════════════════════════════════════════════════════
    // 🎯 IDEAL ANSWER GENERATOR PROMPT
    // ══════════════════════════════════════════════════════════════════════════
    const prompt = `You are a senior technical interviewer and career coach. Generate an IDEAL answer for an interview question.

--------------------------
INPUT:
Question (${category || 'General'} - ${difficulty || 'medium'} difficulty): ${question}
${resumeCtx}

--------------------------
YOUR TASK:

Generate a model answer that would score 9-10/10. This answer should:
1. Directly address the question
2. Show deep domain knowledge or specific experience
3. Use the STAR method structure (Situation → Task → Action → Result)
4. Include specific metrics, quantifiable results, or concrete examples
5. Demonstrate problem-solving ability and impact
6. Include relevant technical terminology or domain knowledge
7. Show leadership, initiative, or strategic thinking where applicable
8. Be confident and well-structured

${difficultyGuidance[difficulty] || difficultyGuidance.medium}

--------------------------
OUTPUT FORMAT (STRICT JSON - no markdown):

{
  "ideal_answer": "The complete ideal answer 150+ words demonstrating best practices",
  "structure_breakdown": {
    "situation": "What was the context/challenge?",
    "task": "What was your specific role or responsibility?",
    "action": "What specific steps did you take?",
    "result": "What measurable outcomes did you achieve?"
  },
  "key_points": [
    "Key point 1 that makes this answer strong",
    "Key point 2 that demonstrates impact",
    "Key point 3 showing specific knowledge"
  ],
  "metrics_included": ["metric1", "metric2"],
  "why_this_is_strong": "2-3 sentences explaining why this answer would score 9-10/10",
  "tips_for_delivery": [
    "Delivery tip 1 (e.g., speak with confidence)",
    "Delivery tip 2 (e.g., maintain eye contact)"
  ]
}`;

    console.log('[Generate Answer] Calling Gemini API...');
    const responseText = await callGeminiAPI(prompt);
    console.log('[Generate Answer] ✅ Gemini API response received');

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Generate Answer] No JSON found in response:', responseText.substring(0, 200));
      throw new Error('Failed to generate ideal answer');
    }

    const result = JSON.parse(jsonMatch[0]);

    console.log('[Generate Answer] ✅ Answer generated successfully');
    res.json({ success: true, result });

  } catch (err) {
    console.error('[Generate Answer Error]', err.message);
    res.status(500).json({ error: 'Failed to generate answer: ' + err.message });
  }
});

// ─── POST /api/analyze/generate-questions — Enhanced question generation ──────
router.post('/generate-questions', async (req, res) => {
  try {
    const { resumeData, category = 'Behavioral', count = 5 } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    console.log(`[Generate Questions] Category="${category}" | Count=${count}`);

    const resumeContext = typeof resumeData === 'string'
      ? resumeData
      : JSON.stringify(resumeData).substring(0, 1500);

    // ══════════════════════════════════════════════════════════════════════════
    // 🎯 ENHANCED QUESTION GENERATOR PROMPT
    // ══════════════════════════════════════════════════════════════════════════
    const prompt = `You are a senior recruiter generating personalized interview questions based on a candidate's resume and background.

--------------------------
CANDIDATE RESUME/BACKGROUND:
${resumeContext}

--------------------------
TASK:

Generate exactly ${count} personalized ${category} interview questions that:
1. Are SPECIFIC to this candidate's background, skills, and experience
2. Cannot be answered by generic textbook knowledge — require their actual experience
3. Probe their depth of knowledge in their stated areas of expertise
4. Would only make sense for THIS candidate based on their resume
5. Vary in difficulty: Easy, Medium, Hard (distributed across the ${count} questions)
6. Follow best practices for ${category} interviews:
   - Behavioral: Use STAR method, focus on real situations
   - Technical: Probe depth, design decisions, problem-solving approach
   - Leadership: Focus on impact, decision-making, team dynamics
   - Product: Require understanding of their domain/role

--------------------------
OUTPUT FORMAT (STRICT JSON - no markdown):

{
  "questions": [
    {
      "id": "q1",
      "question": "Specific, personalized question only THIS candidate can answer well",
      "category": "${category}",
      "difficulty": "easy|medium|hard",
      "hint": "What should a strong answer include?",
      "followUp": "Natural follow-up question an interviewer would ask",
      "why_personalized": "Why this question is specific to their background"
    }
  ]
}`;

    console.log('[Generate Questions] Calling Gemini API...');
    const responseText = await callGeminiAPI(prompt);
    console.log('[Generate Questions] ✅ Gemini API response received');

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Generate Questions] No JSON found:', responseText.substring(0, 200));
      throw new Error('Failed to parse questions');
    }

    const result = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(result.questions)) {
      throw new Error('Questions field is not an array');
    }

    console.log(`[Generate Questions] ✅ Generated ${result.questions.length} questions`);
    res.json({ success: true, questions: result.questions });

  } catch (err) {
    console.error('[Generate Questions Error]', err.message);
    res.status(500).json({ error: 'Failed to generate questions: ' + err.message });
  }
});

module.exports = router;

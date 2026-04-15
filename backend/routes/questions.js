const express = require('express');
const router = express.Router();
const { asyncHandler, AppError, validationError } = require('../middleware/errorHandler');

// Use environment variable for API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_')) {
  console.warn('⚠️ WARNING: GEMINI_API_KEY not properly configured');
}

// Validate API key format
function isValidApiKey(key) {
  return key && !key.includes('your_') && key.length > 10;
}

// Helper function to call Gemini API with retry
async function callGeminiAPI(prompt, retryCount = 0) {
  if (retryCount >= 3) {
    throw new AppError('Gemini API failed after 3 retries', 503, 'API_TIMEOUT');
  }

  if (!GEMINI_API_KEY) {
    throw new AppError('GEMINI_API_KEY not configured', 500, 'CONFIG_ERROR');
  }

  if (!isValidApiKey(GEMINI_API_KEY)) {
    throw new AppError('Invalid API key configuration', 500, 'CONFIG_ERROR');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        }
      }),
      timeout: 30000
    });

    // Handle quota exceeded
    if (response.status === 429) {
      const errorData = await response.json();
      console.warn('[Gemini] Quota exceeded - using fallback');
      throw new AppError('API quota exceeded - using offline questions', 200, 'QUOTA_EXCEEDED');
    }

    // Handle auth errors
    if (response.status === 401 || response.status === 403) {
      console.error(`[Gemini] API key error: ${response.status}`);
      throw new AppError('Invalid or expired API key', 401, 'AUTH_ERROR');
    }

    if (!response.ok) {
      const error = await response.json();
      console.error('[Gemini] API Error:', error);
      throw new AppError(error.error?.message || 'API call failed', response.status, 'API_ERROR');
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new AppError('Invalid response format from API', 500, 'INVALID_RESPONSE');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error(`[Gemini] Error (attempt ${retryCount + 1}):`, err.message);
    
    // Don't retry on auth/config errors
    if (err.code === 'AUTH_ERROR' || err.code === 'CONFIG_ERROR') {
      throw err;
    }

    if (retryCount < 2) {
      await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
      return callGeminiAPI(prompt, retryCount + 1);
    }
    throw err;
  }
}

// Track recently generated questions to prevent repetition
const recentQuestions = new Set();
const MAX_RECENT = 50;

// POST /api/questions/generate
router.post('/generate', asyncHandler(async (req, res) => {
  const { resumeData, category = 'Behavioral', count = 15 } = req.body;

  // Validation
  if (!resumeData) {
    throw validationError('resumeData', 'Resume data is required');
  }

  if (!category) {
    throw validationError('category', 'Category is required');
  }

  const validCategories = ['Behavioral', 'Technical', 'Leadership', 'Product'];
  if (!validCategories.includes(category)) {
    throw validationError('category', `Category must be one of: ${validCategories.join(', ')}`);
  }

  // Limit count to reasonable maximum
  const questionCount = Math.min(Math.max(parseInt(count) || 15, 1), 25);

  const { 
    skills = [], 
    projects = [], 
    experience = [], 
    tools = [], 
    targetRole = 'Software Developer', 
    achievements = [] 
  } = resumeData;

  // Build exclusion list for non-repetition
  const exclusions = [...recentQuestions].slice(-20);
  const exclusionBlock = exclusions.length > 0
    ? `\nDo NOT generate any of these previously asked questions:\n${exclusions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  // ══════════════════════════════════════════════════════════
  // 🔥 NON-REPETITIVE QUESTION GENERATION PROMPT
  // ══════════════════════════════════════════════════════════
  const prompt = `You are an AI Interview Question Generator specializing in creating unique, real-world interview questions.

Generate exactly ${questionCount} UNIQUE and NON-REPETITIVE interview questions for a ${category} interview.

Candidate Profile:
- Target Role: ${targetRole}
- Skills: ${skills.slice(0, 15).join(', ')}
- Tools/Technologies: ${tools.slice(0, 10).join(', ')}
- Projects: ${projects.slice(0, 3).map(p => (p.name || '') + ': ' + (p.description || p.tech || '')).join(' | ')}
- Experience: ${experience.slice(0, 2).map(e => (e.role || '') + ' at ' + (e.company || '')).join(', ')}
- Achievements: ${achievements.slice(0, 3).join(', ')}
${exclusionBlock}

Category-specific focus:
- Behavioral: STAR-method situational questions tied to their specific experience from the resume
- Technical: Deep technical questions about their specific skills, tools, and project challenges
- Leadership: Questions about driving impact, team decisions, conflict, and ownership at scale
- Product: Product thinking, user empathy, prioritization, and metric-driven decision making

Rules:
- Do NOT repeat or paraphrase previous questions
- Vary difficulty: mix Easy, Medium, and Hard questions in each batch
- Focus on real-world scenarios, not textbook definitions
- Make each question specific to the candidate's background — not generic
- Questions should feel like they come from a senior interviewer at a top tech company

Return ONLY valid JSON array (no markdown, no other text):
[
  {
    "id": "q1",
    "question": "Question text here — specific and unique",
    "category": "${category}",
    "difficulty": "easy|medium|hard",
    "hint": "Brief hint on what makes a strong answer",
    "followUp": "Likely follow-up question the interviewer would ask"
  }
]`;

  try {
    const responseText = await callGeminiAPI(prompt);

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[Questions] No JSON found in response:', responseText.substring(0, 200));
      throw new AppError('Failed to generate valid questions', 500, 'JSON_PARSE_ERROR');
    }

    let questions;
    try {
      questions = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('[Questions] JSON parse error:', parseErr.message);
      throw new AppError('Failed to parse generated questions', 500, 'JSON_PARSE_ERROR');
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new AppError('Generated questions are invalid', 500, 'INVALID_QUESTIONS');
    }

    // Track generated questions to prevent future repetition
    for (const q of questions) {
      if (q.question) {
        recentQuestions.add(q.question);
        if (recentQuestions.size > MAX_RECENT) {
          recentQuestions.delete(recentQuestions.values().next().value);
        }
      }
    }

    console.log(`[Questions] Generated ${questions.length} unique questions for ${category}`);
    res.json({ success: true, questions });

  } catch (err) {
    console.error('[Questions Error]', err.code || 'UNKNOWN', err.message);
    
    // If API is down or quota exceeded, return fallback questions
    if (err.code === 'QUOTA_EXCEEDED' || err.code === 'API_ERROR' || err.code === 'API_TIMEOUT') {
      console.log('[Questions] Using fallback questions due to API issue');
      return res.json({
        success: true,
        questions: getFallbackQuestions(category),
        _note: 'Using offline fallback questions (API temporarily unavailable)'
      });
    }

    // Re-throw validation and config errors
    throw err;
  }
}));

function getFallbackQuestions(category) {
  const banks = {
    Behavioral: [
      { id: 'b1', question: 'Tell me about a time you faced a significant challenge on a project and how you overcame it.', category: 'Behavioral', difficulty: 'medium', hint: 'Use STAR method: Situation, Task, Action, Result', followUp: 'What would you do differently now?' },
      { id: 'b2', question: 'Describe a situation where you had to work with a difficult team member. How did you handle it?', category: 'Behavioral', difficulty: 'medium', hint: 'Focus on communication and conflict resolution', followUp: 'What did you learn about collaboration from this experience?' },
      { id: 'b3', question: 'Tell me about a time you had to learn a new technology very quickly. What was your approach?', category: 'Behavioral', difficulty: 'easy', hint: 'Show curiosity, resourcefulness, and learning agility', followUp: 'How do you stay current with new technologies?' }
    ],
    Technical: [
      { id: 't1', question: 'Explain the difference between REST and GraphQL. When would you choose one over the other?', category: 'Technical', difficulty: 'medium', hint: 'Emphasize trade-offs and real use cases', followUp: 'Have you used GraphQL in production? What were the challenges?' },
      { id: 't2', question: 'How would you design a URL shortener like bit.ly? Walk me through your approach.', category: 'Technical', difficulty: 'hard', hint: 'Cover data model, hashing, scalability, and edge cases', followUp: 'How would you handle 1 million requests per second?' },
      { id: 't3', question: 'What are the key differences between SQL and NoSQL databases? When should you use each?', category: 'Technical', difficulty: 'medium', hint: 'Think about data structure, scale, and consistency', followUp: 'Give me an example of a case where you chose the wrong database type.' }
    ],
    Leadership: [
      { id: 'l1', question: 'Tell me about a time you led a project from start to finish. What was your leadership style?', category: 'Leadership', difficulty: 'medium', hint: 'Highlight decision-making, delegation, and accountability', followUp: 'What was your biggest challenge as a leader on that project?' },
      { id: 'l2', question: 'How do you handle situations where your team disagrees with your technical decision?', category: 'Leadership', difficulty: 'hard', hint: 'Show empathy, openness, and decisiveness', followUp: 'Give me a specific example where you changed your mind based on feedback.' }
    ],
    Product: [
      { id: 'p1', question: 'How would you improve the Google Maps user experience for delivery drivers?', category: 'Product', difficulty: 'hard', hint: 'Talk about user research, pain points, metrics, and prioritization', followUp: 'How would you measure the success of your improvements?' },
      { id: 'p2', question: 'Walk me through how you would prioritize a backlog with 50 features and limited resources.', category: 'Product', difficulty: 'medium', hint: 'Mention frameworks like RICE, ICE, or MoSCoW', followUp: 'What happens when stakeholders disagree with your prioritization?' }
    ]
  };
  return banks[category] || banks.Behavioral;
}

// POST /api/questions/generate-all-categories
router.post('/generate-all-categories', asyncHandler(async (req, res) => {
  const { resumeData, count = 15 } = req.body;

  // Validation
  if (!resumeData) {
    throw validationError('resumeData', 'Resume data is required');
  }

  const categories = ['Behavioral', 'Technical', 'Leadership', 'Product'];
  const allQuestions = {};

  // Generate questions for all categories
  for (const category of categories) {
    try {
      console.log(`[Questions] Generating ${count} questions for ${category}...`);
      
      // Make local fetch-like call to generate endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('http://localhost:3001/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, category, count }),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      const data = await response.json();
      
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        allQuestions[category] = data.questions;
      } else {
        // Fallback to static questions
        allQuestions[category] = getFallbackQuestions(category);
      }
    } catch (err) {
      console.warn(`[Questions] Failed to generate ${category}, using fallback:`, err.message);
      allQuestions[category] = getFallbackQuestions(category);
    }
  }

  console.log('[Questions] Generated all categories');
  res.json({
    success: true,
    allQuestions,
    summary: {
      Behavioral: allQuestions.Behavioral?.length || 0,
      Technical: allQuestions.Technical?.length || 0,
      Leadership: allQuestions.Leadership?.length || 0,
      Product: allQuestions.Product?.length || 0,
      total: Object.values(allQuestions).reduce((sum, q) => sum + (q?.length || 0), 0)
    }
  });
}));

module.exports = router;

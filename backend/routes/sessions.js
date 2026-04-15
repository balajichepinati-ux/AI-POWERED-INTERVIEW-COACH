const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// In-memory fallback store (when Supabase is not configured)
const memoryStore = { sessions: [] };

function isSupabaseConfigured() {
  return process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('placeholder') && !process.env.SUPABASE_URL.includes('your-project');
}

// POST /api/sessions — save a completed session
router.post('/', async (req, res) => {
  try {
    const { userId, question, category, answer, analysis } = req.body;

    if (!question || !answer || !analysis) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sessionData = {
      id: `session_${Date.now()}`,
      userId: userId || 'anonymous',
      question,
      category,
      answer: answer.substring(0, 2000),
      overallScore: analysis.overallScore,
      clarityScore: analysis.clarityScore,
      structureScore: analysis.structureScore,
      confidenceScore: analysis.confidenceScore,
      relevanceScore: analysis.relevanceScore,
      englishScore: analysis.englishScore,
      fluencyScore: analysis.fluencyScore,
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      fillerWords: analysis.fillerWords,
      rewriteSuggestion: analysis.rewriteSuggestion,
      followUpQuestion: analysis.followUpQuestion,
      verdict: analysis.verdict,
      shortSummary: analysis.shortSummary,
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured() && userId) {
      try {
        const { data, error } = await supabase.from('sessions').insert([{
          user_id: userId,
          question,
          category,
          answer: answer.substring(0, 2000),
          overall_score: analysis.overallScore,
          clarity_score: analysis.clarityScore,
          structure_score: analysis.structureScore,
          confidence_score: analysis.confidenceScore,
          relevance_score: analysis.relevanceScore,
          english_score: analysis.englishScore,
          fluency_score: analysis.fluencyScore,
          strengths: analysis.strengths,
          improvements: analysis.improvements,
          filler_words: analysis.fillerWords,
          rewrite_suggestion: analysis.rewriteSuggestion,
          follow_up_question: analysis.followUpQuestion,
          verdict: analysis.verdict,
          short_summary: analysis.shortSummary
        }]).select().single();

        if (!error && data) {
          return res.json({ success: true, session: data });
        }
      } catch (dbErr) {
        console.warn('[DB Warning] Falling back to memory store:', dbErr.message);
      }
    }

    // Memory fallback
    memoryStore.sessions.unshift(sessionData);
    if (memoryStore.sessions.length > 100) memoryStore.sessions.pop();

    res.json({ success: true, session: sessionData });
  } catch (err) {
    console.error('[Sessions POST Error]', err);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// GET /api/sessions — get sessions for a user
router.get('/', async (req, res) => {
  try {
    const { userId, category, limit = 20 } = req.query;

    if (isSupabaseConfigured() && userId) {
      try {
        let query = supabase
          .from('sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(parseInt(limit));

        if (category && category !== 'All') {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (!error && data) {
          // Map snake_case from database to camelCase for frontend
          const mappedSessions = data.map(s => ({
            id: s.id,
            userId: s.user_id,
            question: s.question,
            category: s.category,
            answer: s.answer,
            overallScore: s.overall_score,
            clarityScore: s.clarity_score,
            structureScore: s.structure_score,
            confidenceScore: s.confidence_score,
            relevanceScore: s.relevance_score,
            englishScore: s.english_score,
            fluencyScore: s.fluency_score,
            strengths: s.strengths,
            improvements: s.improvements,
            fillerWords: s.filler_words,
            rewriteSuggestion: s.rewrite_suggestion,
            followUpQuestion: s.follow_up_question,
            verdict: s.verdict,
            shortSummary: s.short_summary,
            createdAt: s.created_at
          }));
          return res.json({ success: true, sessions: mappedSessions });
        }
      } catch (dbErr) {
        console.warn('[DB Warning] Using memory store:', dbErr.message);
      }
    }

    // Memory fallback
    let sessions = memoryStore.sessions;
    if (userId) sessions = sessions.filter(s => s.userId === userId || s.userId === 'anonymous');
    if (category && category !== 'All') sessions = sessions.filter(s => s.category === category);

    res.json({ success: true, sessions: sessions.slice(0, parseInt(limit)) });
  } catch (err) {
    console.error('[Sessions GET Error]', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/sessions/stats — score trends and averages
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;

    let sessions = [];

    // Try database first (Supabase or Prisma)
    if (isSupabaseConfigured() && userId) {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          sessions = data.map(s => ({
            id: s.id,
            userId: s.user_id,
            question: s.question,
            category: s.category,
            answer: s.answer,
            overallScore: s.overall_score,
            clarityScore: s.clarity_score,
            structureScore: s.structure_score,
            confidenceScore: s.confidence_score,
            relevanceScore: s.relevance_score,
            englishScore: s.english_score,
            fluencyScore: s.fluency_score,
            strengths: s.strengths,
            improvements: s.improvements,
            fillerWords: s.filler_words,
            rewriteSuggestion: s.rewrite_suggestion,
            followUpQuestion: s.follow_up_question,
            verdict: s.verdict,
            shortSummary: s.short_summary,
            createdAt: s.created_at
          }));
        }
      } catch (dbErr) {
        console.warn('[Stats] Supabase query failed:', dbErr.message);
      }
    }

    // Fallback to memory store if no database results
    if (sessions.length === 0) {
      let memSessions = memoryStore.sessions;
      if (userId) {
        memSessions = memSessions.filter(s => s.userId === userId || s.userId === 'anonymous');
      }
      sessions = memSessions;
    }

    // If we have no sessions, return proper empty stats
    if (sessions.length === 0) {
      return res.json({ 
        success: true, 
        stats: {
          totalSessions: 0,
          averageScore: 0,
          bestScore: 0,
          recentScore: 0,
          trend: [],
          byCategory: {}
        }
      });
    }

    // Calculate stats from all sessions
    const scores = sessions
      .map(s => s.overallScore)
      .filter(s => typeof s === 'number' && s >= 0);

    if (scores.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalSessions: sessions.length,
          averageScore: 0,
          bestScore: 0,
          recentScore: 0,
          trend: [],
          byCategory: {}
        }
      });
    }

    const stats = {
      totalSessions: sessions.length,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      bestScore: Math.max(...scores),
      recentScore: scores[0] || 0,
      // Reverse trend to show oldest → newest
      trend: sessions
        .slice(0, 20)
        .reverse()
        .map(s => ({
          date: s.createdAt,
          score: s.overallScore,
          category: s.category
        })),
      byCategory: {}
    };

    // Calculate stats by category
    const categories = ['Behavioral', 'Technical', 'Leadership', 'Product'];
    for (const cat of categories) {
      const catSessions = sessions.filter(s => s.category === cat);
      if (catSessions.length > 0) {
        const catScores = catSessions
          .map(s => s.overallScore)
          .filter(s => typeof s === 'number' && s >= 0);
        
        if (catScores.length > 0) {
          stats.byCategory[cat] = {
            count: catSessions.length,
            avg: Math.round(catScores.reduce((a, s) => a + s, 0) / catScores.length)
          };
        }
      }
    }

    res.json({ success: true, stats });
  } catch (err) {
    console.error('[Stats Error]', err);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      stats: {
        totalSessions: 0,
        averageScore: 0,
        bestScore: 0,
        recentScore: 0,
        trend: [],
        byCategory: {}
      }
    });
  }
});

module.exports = router;

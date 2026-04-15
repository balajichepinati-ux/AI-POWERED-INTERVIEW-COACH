/**
 * Resume Analysis & Dashboard Service
 * Integrates Gemini AI for comprehensive resume analysis and dashboard insights
 */

import GeminiService from './gemini'

/**
 * Analyze resume and generate comprehensive profile
 */
export async function analyzeResumeComprehensive(resumeText) {
  try {
    const analysis = await GeminiService.analyzeResume(resumeText)
    
    // Generate tailored questions based on analysis
    const questions = await GeminiService.generateQuestions(analysis, 'general', 10)
    
    return {
      success: true,
      profile: analysis,
      initialQuestions: questions,
      readyForPractice: true
    }
  } catch (error) {
    console.error('Resume analysis error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Generate comprehensive dashboard after practice session
 */
export async function generateSessionDashboard(sessionData) {
  try {
    const insights = await GeminiService.generateDashboardInsights(sessionData)
    return {
      success: true,
      insights,
      generated: new Date().toISOString()
    }
  } catch (error) {
    console.error('Dashboard generation error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get STAR method rewrite for answer
 */
export async function getStarMethodRewrite(question, currentAnswer) {
  try {
    const rewrite = await GeminiService.generateStarRewrite(question, currentAnswer)
    return {
      success: true,
      rewrite
    }
  } catch (error) {
    console.error('STAR rewrite error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Generate personalized study plan
 */
export async function generatePersonalizedStudyPlan(resumeAnalysis, weakAreas, daysAvailable = 14) {
  try {
    const plan = await GeminiService.generateStudyPlan(resumeAnalysis, weakAreas, daysAvailable)
    return {
      success: true,
      plan
    }
  } catch (error) {
    console.error('Study plan generation error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Generate AI-powered feedback for multiple answers
 */
export async function generateBatchFeedback(answers) {
  try {
    const feedbackPromises = answers.map(({ question, answer, category }) =>
      GeminiService.evaluateAnswer(question, answer, category)
    )
    
    const feedbacks = await Promise.all(feedbackPromises)
    
    // Calculate aggregate scores
    const avgScore = feedbacks.reduce((sum, f) => sum + f.score, 0) / feedbacks.length
    const topStrengths = [...new Set(feedbacks.flatMap(f => f.strengths))].slice(0, 5)
    const topImprovements = [...new Set(feedbacks.flatMap(f => f.areasForImprovement))].slice(0, 5)
    
    return {
      success: true,
      feedbacks,
      summary: {
        averageScore: Math.round(avgScore),
        topStrengths,
        topImprovements,
        totalAnswersReviewed: answers.length
      }
    }
  } catch (error) {
    console.error('Batch feedback error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export default {
  analyzeResumeComprehensive,
  generateSessionDashboard,
  getStarMethodRewrite,
  generatePersonalizedStudyPlan,
  generateBatchFeedback
}

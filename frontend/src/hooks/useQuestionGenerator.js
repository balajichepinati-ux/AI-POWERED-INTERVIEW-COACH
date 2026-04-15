import { useState, useCallback } from 'react'
import { generateAllCategoriesQuestions, generateQuestionsFromAnalysis } from '../lib/api'
import { getQuestionsByCategory, CATEGORIES } from '../data/questions'

/**
 * Custom hook for generating interview questions across all 4 categories
 * with resume-based personalization
 */
export function useQuestionGenerator() {
  const [allQuestions, setAllQuestions] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedAt, setGeneratedAt] = useState(null)

  // Generate questions for all 4 categories
  const generateForAllCategories = useCallback(async (resumeData, count = 15) => {
    if (!resumeData) {
      setError('Resume data required')
      return false
    }

    setLoading(true)
    setError('')

    try {
      console.log('[useQuestionGenerator] Starting generation for all categories...')
      
      const result = await generateAllCategoriesQuestions(resumeData, count)

      if (result.success && result.allQuestions) {
        setAllQuestions(result.allQuestions)
        setGeneratedAt(new Date())
        console.log('[useQuestionGenerator] ✅ All categories generated:', result.summary)
        return true
      } else {
        throw new Error('Failed to generate questions')
      }
    } catch (err) {
      console.error('[useQuestionGenerator] Error:', err.message)
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Generate questions for a specific category
  const generateForCategory = useCallback(async (resumeData, category = 'Behavioral', count = 15) => {
    if (!resumeData) {
      setError('Resume data required')
      return false
    }

    setLoading(true)
    setError('')

    try {
      console.log(`[useQuestionGenerator] Generating ${count} questions for ${category}...`)
      
      const result = await generateQuestionsFromAnalysis(resumeData, category, count)

      if (result.success && result.questions) {
        setAllQuestions(prev => ({
          ...prev,
          [category]: result.questions
        }))
        setGeneratedAt(new Date())
        console.log(`[useQuestionGenerator] ✅ ${category} generated:`, result.questions.length)
        return true
      } else {
        throw new Error(`Failed to generate ${category} questions`)
      }
    } catch (err) {
      console.error('[useQuestionGenerator] Error:', err.message)
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Get questions for a specific category
  const getQuestions = useCallback((category) => {
    return allQuestions[category] || getQuestionsByCategory(category)
  }, [allQuestions])

  // Get total question count
  const getTotalCount = useCallback(() => {
    return Object.values(allQuestions).reduce((sum, questions) => sum + (questions?.length || 0), 0)
  }, [allQuestions])

  // Clear all questions
  const clearQuestions = useCallback(() => {
    setAllQuestions({})
    setGeneratedAt(null)
    setError('')
  }, [])

  return {
    allQuestions,
    loading,
    error,
    generatedAt,
    generateForAllCategories,
    generateForCategory,
    getQuestions,
    getTotalCount,
    clearQuestions,
    hasQuestions: Object.keys(allQuestions).length > 0,
  }
}

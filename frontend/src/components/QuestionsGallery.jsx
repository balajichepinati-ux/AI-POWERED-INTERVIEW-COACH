import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Sparkles, BookOpen, RefreshCw } from 'lucide-react'

/**
 * QuestionsGallery Component
 * Displays AI-generated interview questions across all 4 categories
 */
export default function QuestionsGallery({ allQuestions, onSelectQuestion, loading = false, onRegenerate }) {
  const [expandedCategory, setExpandedCategory] = useState('Behavioral')
  const CATEGORY_COLORS = {
    Behavioral: 'violet',
    Technical: 'cyan',
    Leadership: 'amber',
    Product: 'green'
  }

  const CATEGORY_ICONS = {
    Behavioral: '🧠',
    Technical: '⚙️',
    Leadership: '🚀',
    Product: '📦'
  }

  const categories = ['Behavioral', 'Technical', 'Leadership', 'Product']
  
  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'text-green-400 bg-green-500/10',
      medium: 'text-amber-400 bg-amber-500/10',
      hard: 'text-red-400 bg-red-500/10'
    }
    return colors[difficulty] || colors.medium
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles size={24} className="text-brand-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Generated Interview Questions</h2>
            <p className="text-sm text-gray-400 mt-1">
              {Object.values(allQuestions).reduce((sum, q) => sum + (q?.length || 0), 0)} AI-personalized questions ready to practice
            </p>
          </div>
        </div>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Regenerate
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="space-y-4">
        {categories.map((category) => {
          const questions = allQuestions[category] || []
          const isExpanded = expandedCategory === category
          const color = CATEGORY_COLORS[category]
          const icon = CATEGORY_ICONS[category]

          return (
            <motion.div
              key={category}
              className={`glass-card border-l-4 border-l-${color}-500/50 overflow-hidden`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{icon}</span>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white group-hover:text-brand-300 transition-colors">
                      {category}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {questions.length} question{questions.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={20} className={`text-${color}-400`} />
                </motion.div>
              </button>

              {/* Expanded Questions List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-white/10 bg-black/30"
                  >
                    <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                      {questions.length > 0 ? (
                        questions.map((q, idx) => (
                          <motion.div
                            key={q.id || idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => onSelectQuestion && onSelectQuestion(q, category)}
                            className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 cursor-pointer transition-all group"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                  {q.question}
                                </p>
                                {q.hint && (
                                  <p className="text-xs text-gray-500 mt-2 italic">
                                    💡 {q.hint}
                                  </p>
                                )}
                              </div>
                              {q.difficulty && (
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getDifficultyColor(q.difficulty)}`}>
                                  {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-center text-gray-400 py-8">
                          No questions generated for this category
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Empty State */}
      {Object.values(allQuestions).reduce((sum, q) => sum + (q?.length || 0), 0) === 0 && (
        <div className="text-center py-16">
          <BookOpen size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No questions generated yet. Upload your resume to get started.</p>
        </div>
      )}
    </div>
  )
}

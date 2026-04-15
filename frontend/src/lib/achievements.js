/**
 * Achievement System & Streak Tracking
 */

const STORAGE_KEY = 'mockmate_achievements'

/**
 * Define all achievements
 */
export const ACHIEVEMENTS = {
  // Streak achievements
  STREAK_3: { id: 'streak_3', name: '🔥 On Fire', description: '3 day practice streak', icon: '🔥', requirement: 3 },
  STREAK_7: { id: 'streak_7', name: '💪 Week Warrior', description: '7 day practice streak', icon: '💪', requirement: 7 },
  STREAK_30: { id: 'streak_30', name: '🏆 Monthly Master', description: '30 day practice streak', icon: '🏆', requirement: 30 },

  // Score achievements
  PERFECT_10: { id: 'perfect_10', name: '💯 Perfect 10', description: 'Score 100 on any question', icon: '💯', requirement: 100 },
  AVERAGE_90: { id: 'average_90', name: '🎯 Consistent', description: 'Maintain 90+ average', icon: '🎯', requirement: 90 },

  // Volume achievements
  QUESTIONS_10: { id: 'questions_10', name: '🚀 Getting Started', description: 'Answer 10 questions', icon: '🚀', requirement: 10 },
  QUESTIONS_50: { id: 'questions_50', name: '⚡ Active Practitioner', description: 'Answer 50 questions', icon: '⚡', requirement: 50 },
  QUESTIONS_100: { id: 'questions_100', name: '👑 Expert', description: 'Answer 100 questions', icon: '👑', requirement: 100 },

  // Category mastery
  BEHAVIORAL_MASTER: { id: 'behavioral_master', name: 'Behavioral Expert', description: 'Master Behavioral questions', icon: '🧠', requirement: 'category' },
  TECHNICAL_MASTER: { id: 'technical_master', name: 'Technical Expert', description: 'Master Technical questions', icon: '⚙️', requirement: 'category' },
  LEADERSHIP_MASTER: { id: 'leadership_master', name: 'Leadership Expert', description: 'Master Leadership questions', icon: '🚀', requirement: 'category' },
  PRODUCT_MASTER: { id: 'product_master', name: 'Product Expert', description: 'Master Product questions', icon: '📦', requirement: 'category' }
}

/**
 * Achievement Manager
 */
export class AchievementManager {
  constructor() {
    this.achievements = this.load()
  }

  load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    } catch {
      return {}
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.achievements))
  }

  unlock(achievementId) {
    if (!ACHIEVEMENTS[achievementId]) return false

    if (this.achievements[achievementId]) {
      return false // Already unlocked
    }

    this.achievements[achievementId] = {
      id: achievementId,
      unlockedAt: new Date().toISOString(),
      ...ACHIEVEMENTS[achievementId]
    }

    this.save()
    console.log('[Achievement] Unlocked:', ACHIEVEMENTS[achievementId].name)
    return true
  }

  isUnlocked(achievementId) {
    return !!this.achievements[achievementId]
  }

  getAll() {
    return Object.values(this.achievements)
  }

  getProgress(achievementId) {
    return this.achievements[achievementId] || null
  }
}

/**
 * Streak Manager
 */
export class StreakManager {
  constructor() {
    this.data = this.load()
  }

  load() {
    try {
      const data = JSON.parse(localStorage.getItem('mockmate_streak') || '{}')
      return data
    } catch {
      return { currentStreak: 0, longestStreak: 0, lastPracticedDate: null, practicesThisMonth: 0 }
    }
  }

  save() {
    localStorage.setItem('mockmate_streak', JSON.stringify(this.data))
  }

  recordPractice() {
    const today = new Date().toDateString()
    const lastDate = this.data.lastPracticedDate

    // Check if already practiced today
    if (lastDate === today) {
      return // Already recorded for today
    }

    const lastDateObj = lastDate ? new Date(lastDate) : null
    const todayObj = new Date()

    // Check if consecutive (yesterday or today)
    if (lastDateObj) {
      const diffDays = Math.floor((todayObj - lastDateObj) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        // Continue streak
        this.data.currentStreak++
      } else if (diffDays > 1) {
        // Streak broken, start new one
        this.data.currentStreak = 1
      }
    } else {
      this.data.currentStreak = 1
    }

    // Update longest streak
    if (this.data.currentStreak > this.data.longestStreak) {
      this.data.longestStreak = this.data.currentStreak
    }

    this.data.lastPracticedDate = today
    this.data.practicesThisMonth = (this.data.practicesThisMonth || 0) + 1

    this.save()
    return this.data.currentStreak
  }

  getStreak() {
    return this.data.currentStreak || 0
  }

  getLongestStreak() {
    return this.data.longestStreak || 0
  }

  getStats() {
    return {
      currentStreak: this.getStreak(),
      longestStreak: this.getLongestStreak(),
      practicesThisMonth: this.data.practicesThisMonth || 0
    }
  }
}

/**
 * Stat aggregator
 */
export class StatAggregator {
  constructor() {
    this.achievements = new AchievementManager()
    this.streak = new StreakManager()
  }

  // Check and unlock achievements
  async checkAchievements(stats) {
    const unlocked = []

    // Check streak achievements
    const currentStreak = this.streak.getStreak()
    if (currentStreak >= 30 && !this.achievements.isUnlocked('STREAK_30')) {
      this.achievements.unlock('STREAK_30')
      unlocked.push('STREAK_30')
    } else if (currentStreak >= 7 && !this.achievements.isUnlocked('STREAK_7')) {
      this.achievements.unlock('STREAK_7')
      unlocked.push('STREAK_7')
    } else if (currentStreak >= 3 && !this.achievements.isUnlocked('STREAK_3')) {
      this.achievements.unlock('STREAK_3')
      unlocked.push('STREAK_3')
    }

    // Check question count achievements
    const totalQuestions = stats.totalSessions || 0
    if (totalQuestions >= 100 && !this.achievements.isUnlocked('QUESTIONS_100')) {
      this.achievements.unlock('QUESTIONS_100')
      unlocked.push('QUESTIONS_100')
    } else if (totalQuestions >= 50 && !this.achievements.isUnlocked('QUESTIONS_50')) {
      this.achievements.unlock('QUESTIONS_50')
      unlocked.push('QUESTIONS_50')
    } else if (totalQuestions >= 10 && !this.achievements.isUnlocked('QUESTIONS_10')) {
      this.achievements.unlock('QUESTIONS_10')
      unlocked.push('QUESTIONS_10')
    }

    // Check score achievements
    if (stats.bestScore === 100 && !this.achievements.isUnlocked('PERFECT_10')) {
      this.achievements.unlock('PERFECT_10')
      unlocked.push('PERFECT_10')
    }

    if (stats.averageScore >= 90 && !this.achievements.isUnlocked('AVERAGE_90')) {
      this.achievements.unlock('AVERAGE_90')
      unlocked.push('AVERAGE_90')
    }

    return unlocked
  }

  getProgress() {
    return {
      achievements: this.achievements.getAll().length,
      totalAchievements: Object.keys(ACHIEVEMENTS).length,
      streak: this.streak.getStats()
    }
  }
}

export const aggregator = new StatAggregator()

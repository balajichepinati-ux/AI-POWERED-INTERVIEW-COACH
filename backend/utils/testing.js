/**
 * Testing utilities and helpers
 */

// Mock API responses for testing
export const mockResponses = {
  successQuestion: {
    success: true,
    questions: [
      {
        id: 'test_q1',
        question: 'What is your greatest strength?',
        category: 'Behavioral',
        difficulty: 'medium',
        hint: 'Be specific and relevant'
      }
    ]
  },

  successAnalysis: {
    success: true,
    analysis: {
      overallScore: 85,
      clarityScore: 80,
      structureScore: 90,
      confidenceScore: 85,
      relevanceScore: 88,
      englishScore: 85,
      fluencyScore: 82,
      verdict: 'Good',
      strengths: ['Clear structure', 'Good examples'],
      improvements: ['Add more specifics', 'Improve pacing'],
      shortSummary: 'Good answer with clear structure'
    }
  },

  errorResponse: {
    error: 'An error occurred',
    status: 500
  }
}

// Test data generators
export function generateTestSession(overrides = {}) {
  return {
    id: `test_${Date.now()}`,
    userId: 'test_user',
    question: 'Test question',
    category: 'Behavioral',
    answer: 'Test answer',
    overallScore: 85,
    createdAt: new Date().toISOString(),
    ...overrides
  }
}

export function generateTestUser(overrides = {}) {
  return {
    id: 'test_user_' + Math.random().toString(36),
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date().toISOString(),
    ...overrides
  }
}

// Wait utilities
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function waitFor(condition, timeout = 1000, interval = 100) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (condition()) return true
    await wait(interval)
  }
  throw new Error('Timeout waiting for condition')
}

// Assertion helpers
export const assert = {
  equal: (actual, expected, message) => {
    if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`)
  },

  truthy: (value, message) => {
    if (!value) throw new Error(`${message}: expected truthy value`)
  },

  falsy: (value, message) => {
    if (value) throw new Error(`${message}: expected falsy value`)
  },

  throws: (fn, message) => {
    try {
      fn()
      throw new Error(`${message}: function did not throw`)
    } catch (err) {
      if (err.message && err.message.includes('did not throw')) throw err
    }
  }
}

// Mock fetch
export function setupMockFetch(responses = {}) {
  const originalFetch = global.fetch

  global.fetch = jest.fn(async (url, options) => {
    const key = `${options?.method || 'GET'} ${url}`
    const response = responses[key] || { error: 'No mock response', status: 404 }

    return {
      ok: response.status < 400,
      status: response.status || 200,
      json: async () => response,
      text: async () => JSON.stringify(response),
      blob: async () => new Blob([JSON.stringify(response)])
    }
  })

  return () => {
    global.fetch = originalFetch
  }
}

// LocalStorage mock
export function setupLocalStorageMock() {
  const store = {}

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString() },
    removeItem: (key) => { delete store[key] },
    clear: () => { Object.keys(store).forEach(key => delete store[key]) }
  }
}

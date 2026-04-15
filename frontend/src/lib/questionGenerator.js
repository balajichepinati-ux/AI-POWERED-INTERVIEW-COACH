/**
 * Zero-API Resume-Based Question Generator
 * ─────────────────────────────────────────
 * Generates personalized interview questions directly from a resume profile
 * WITHOUT any API calls. Uses template substitution with resume fields.
 *
 * This is the guaranteed fallback when all Gemini API keys are exhausted.
 */

// ── Template libraries per category ──────────────────────────────────────────

const BEHAVIORAL_TEMPLATES = [
  (p) => `Tell me about a time you used ${pick(p.skills)} in a high-pressure situation. What was the outcome?`,
  (p) => `Describe a challenge you faced while working on ${pick(p.projects) || 'a major project'}. How did you overcome it?`,
  (p) => `You've worked with ${pick(p.skills)} and ${pick(p.tools)}. Tell me about a time these skills helped you solve a difficult problem.`,
  (p) => `As someone targeting a ${p.targetRole} role, describe a situation where you had to learn something new quickly to meet a deadline.`,
  (p) => `Tell me about a time your work directly impacted the user or customer. What did you do and how did you measure success?`,
  (p) => `Describe a situation where you disagreed with a technical decision made by your team. How did you handle it?`,
  (p) => `Give me an example of a project where you had to balance multiple competing priorities. How did you decide what to focus on?`,
  (p) => `Tell me about a time you received critical feedback on your code or work. How did you respond?`,
  (p) => `Walk me through a situation where a project you led didn't go as planned. What happened and what did you learn?`,
  (p) => `Describe a time when you had to collaborate with someone whose working style was very different from yours.`,
]

const TECHNICAL_TEMPLATES = [
  (p) => `Walk me through how you've used ${pick(p.skills)} in production. What were the trade-offs you made?`,
  (p) => `How would you design a scalable backend system using ${pick(p.tools) || pick(p.skills)}? What bottlenecks would you anticipate?`,
  (p) => `You listed ${pick(p.skills)} as a skill. Explain how it works under the hood and when you'd choose it over alternatives.`,
  (p) => `In your experience with ${pick(p.projects) || 'one of your projects'}, how did you handle data consistency and error recovery?`,
  (p) => `Describe your approach to testing and code quality when working with ${pick(p.skills)}.`,
  (p) => `How would you optimize a slow ${pick(p.skills) || 'application'} that handles thousands of requests per second?`,
  (p) => `What is your approach to debugging a production issue in a ${pick(p.tools) || pick(p.skills)}-based system?`,
  (p) => `How have you used ${pick(p.tools) || pick(p.skills)} to improve developer productivity or system reliability?`,
  (p) => `Explain a complex technical decision you made in one of your projects. What alternatives did you consider?`,
  (p) => `If you were onboarding a new engineer to your ${pick(p.skills)} codebase, what concepts would you prioritize explaining?`,
]

const LEADERSHIP_TEMPLATES = [
  (p) => `Tell me about a time you led a ${pick(p.skills)}-related initiative from inception to delivery. How did you keep the team aligned?`,
  (p) => `As a ${p.targetRole}, how do you make technical decisions when facing time pressure and incomplete information?`,
  (p) => `Describe a time you mentored a junior engineer. What approach did you take and what was the outcome?`,
  (p) => `Tell me about a time you had to advocate for a technical decision that others resisted. How did you build consensus?`,
  (p) => `How have you driven adoption of a new technology or process (like ${pick(p.tools) || pick(p.skills)}) within your team?`,
  (p) => `Describe a situation where you had to manage expectations between engineering and non-technical stakeholders.`,
  (p) => `How do you handle situations where your team is behind on a critical project deadline?`,
  (p) => `Tell me about a time you had to make a difficult personnel decision or give tough feedback to a peer.`,
  (p) => `As someone with experience in ${pick(p.skills)}, how do you ensure code quality without slowing down velocity?`,
  (p) => `Describe your approach to running effective technical project retrospectives and turning learnings into action.`,
]

const PRODUCT_TEMPLATES = [
  (p) => `Given your background in ${pick(p.skills)}, how would you define success metrics for a new developer-facing feature?`,
  (p) => `If you were building a product using ${pick(p.tools) || pick(p.skills)}, how would you prioritize the backlog for a 3-person team?`,
  (p) => `Walk me through how you'd approach improving the user experience of a tool like ${pick(p.projects) || 'one of your projects'}.`,
  (p) => `A key engagement metric drops 25% overnight in your ${pick(p.skills)}-based product. How do you investigate?`,
  (p) => `How would you balance technical debt reduction vs new feature development as a ${p.targetRole}?`,
  (p) => `Describe how empathy for the end user has shaped a technical decision you've made.`,
  (p) => `How would you measure the ROI of a refactoring effort or infrastructure improvement?`,
  (p) => `If you had to kill one feature in a product and reinvest that effort, how would you decide what to cut?`,
  (p) => `How do you approach gathering user feedback when building developer tools or APIs?`,
  (p) => `Walk me through how you would run a product experiment (A/B test) in a system built with ${pick(p.skills)}.`,
]

// ── Hints per category ────────────────────────────────────────────────────────

const BEHAVIORAL_HINTS = [
  'Use STAR method: Situation, Task, Action, Result. Be specific.',
  'Focus on what YOU personally did, not what the team did.',
  'Quantify impact wherever possible — numbers make stories stronger.',
  'Show growth: what did you learn from this experience?',
  'Avoid vague answers — pick one specific instance.',
]

const TECHNICAL_HINTS = [
  'Explain trade-offs, not just what you did.',
  'Show depth: mention edge cases, failure modes, and alternatives considered.',
  'Use concrete numbers when discussing scale or performance.',
  'Demonstrate system-level thinking beyond just code.',
  'Discuss how you validated your technical choice was correct.',
]

const LEADERSHIP_HINTS = [
  'Show how you influenced without authority if applicable.',
  'Demonstrate data-driven decision making.',
  'Highlight how you handled disagreement or conflict constructively.',
  'Show structured thinking: how did you break down the problem?',
  'Focus on outcomes: what changed because of your leadership?',
]

const PRODUCT_HINTS = [
  'Define the user persona before proposing solutions.',
  'Use a prioritization framework: RICE, ICE, MoSCoW, etc.',
  'Tie decisions to measurable outcomes and metrics.',
  'Show you can make hard trade-off decisions with incomplete data.',
  'Demonstrate you balance user needs with technical constraints.',
]

// ── Follow-up questions per category ──────────────────────────────────────────

const FOLLOWUPS = {
  Behavioral:  [
    'What would you do differently if you faced that situation today?',
    'How did this experience shape how you work now?',
    'Who else was involved, and what was their role?',
  ],
  Technical:   [
    'What would you change about that approach today?',
    'How did you ensure it was maintainable long-term?',
    'What monitoring or observability did you put in place?',
  ],
  Leadership:  [
    'How did the team respond initially?',
    'What would you do differently to get buy-in faster?',
    'How did you measure the success of your leadership here?',
  ],
  Product:     [
    'How would you validate that hypothesis with real users?',
    'What guardrail metrics would you watch to prevent regressions?',
    'How would you communicate this decision to stakeholders?',
  ],
}

// ── Difficulty distributions ──────────────────────────────────────────────────

const DIFFICULTIES = ['easy', 'medium', 'medium', 'hard', 'hard']

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick(arr) {
  if (!arr || arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickHint(category) {
  const hints = {
    Behavioral: BEHAVIORAL_HINTS,
    Technical:  TECHNICAL_HINTS,
    Leadership: LEADERSHIP_HINTS,
    Product:    PRODUCT_HINTS,
  }
  return pick(hints[category] || BEHAVIORAL_HINTS)
}

function pickFollowUp(category) {
  return pick(FOLLOWUPS[category] || FOLLOWUPS.Behavioral)
}

// Shuffle array in place
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate personalized interview questions from a resume profile.
 * Works completely offline — no API calls required.
 *
 * @param {object} profile - Parsed resume profile
 * @param {string} category - 'Behavioral' | 'Technical' | 'Leadership' | 'Product'
 * @param {number} count - Number of questions to generate (default 5)
 * @returns {Array} Array of question objects
 */
export function generateFromProfile(profile, category = 'Behavioral', count = 5) {
  // Normalise profile fields — handle both backend and frontend schemas
  const p = {
    skills:     [...(profile.skills       || profile.technologies || [])                ].filter(Boolean),
    tools:      [...(profile.tools        || profile.frameworks   || profile.languages  || [])].filter(Boolean),
    projects:   [...(profile.projects     || [])].map(proj =>
      typeof proj === 'string' ? proj : proj.name || proj.title || ''
    ).filter(Boolean),
    experience: [...(profile.experience   || [])].map(exp =>
      typeof exp === 'string' ? exp : `${exp.role || ''} at ${exp.company || ''}`.trim()
    ).filter(Boolean),
    strengths:  [...(profile.strengths    || profile.keyStrengths || profile.achievements || [])].filter(Boolean),
    targetRole: profile.targetRole  || profile.target_role || 'Software Developer',
  }

  // Pick the right template library
  const templateLibraries = {
    Behavioral: BEHAVIORAL_TEMPLATES,
    Technical:  TECHNICAL_TEMPLATES,
    Leadership: LEADERSHIP_TEMPLATES,
    Product:    PRODUCT_TEMPLATES,
  }
  const templates = templateLibraries[category] || BEHAVIORAL_TEMPLATES

  // Shuffle templates and pick `count` unique ones
  const shuffled  = shuffle([...templates])
  const selected  = shuffled.slice(0, Math.min(count, shuffled.length))

  return selected.map((templateFn, idx) => {
    const questionText = templateFn(p)
    return {
      id:         `gen_${category.toLowerCase()[0]}${idx + 1}`,
      question:   questionText,
      category,
      difficulty: DIFFICULTIES[idx % DIFFICULTIES.length],
      hint:       pickHint(category),
      followUp:   pickFollowUp(category),
      _source:    'offline-template',
    }
  })
}

export default { generateFromProfile }

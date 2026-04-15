// Static curated question bank — 20+ questions across 4 categories
export const CATEGORIES = [
  { id: 'Behavioral', label: 'Behavioral', icon: '🧠', color: 'violet', desc: 'STAR-method questions about your past experiences' },
  { id: 'Technical', label: 'Technical', icon: '⚙️', color: 'cyan', desc: 'Deep dives into your technical skills and projects' },
  { id: 'Leadership', label: 'Leadership', icon: '🚀', color: 'amber', desc: 'Questions about leading teams and driving impact' },
  { id: 'Product', label: 'Product', icon: '📦', color: 'green', desc: 'Product thinking, design decisions, and user empathy' },
]

export const QUESTION_BANK = {
  Behavioral: [
    { id: 'b1', question: 'Tell me about a time you faced a major setback on a project. How did you handle it and what did you learn?', difficulty: 'medium', hint: 'Use STAR: Situation, Task, Action, Result. Focus on what you did, not just what happened.' },
    { id: 'b2', question: 'Describe a situation where you had to work with a difficult team member. How did you navigate it?', difficulty: 'medium', hint: 'Show empathy, communication skills, and professionalism. Avoid blaming.' },
    { id: 'b3', question: 'Tell me about a time you had to learn a completely new technology in a short period. What was your approach?', difficulty: 'easy', hint: 'Highlight curiosity, self-direction, and speed of learning.' },
    { id: 'b4', question: 'Describe a time when you disagreed with your manager or team. How did you handle it?', difficulty: 'hard', hint: 'Show you can respectfully push back with data, while remaining a team player.' },
    { id: 'b5', question: 'Tell me about your most impactful project. What was your role and how did you measure success?', difficulty: 'medium', hint: 'Quantify impact wherever possible. Use numbers and outcomes.' },
    { id: 'b6', question: 'Give me an example of a time you had to manage multiple competing priorities. How did you decide what to focus on?', difficulty: 'medium', hint: 'Discuss how you evaluated urgency vs importance and communicated trade-offs.' },
  ],
  Technical: [
    { id: 't1', question: 'Walk me through the most complex technical problem you\'ve solved. What was your approach?', difficulty: 'hard', hint: 'Clearly define the problem, your constraints, and the trade-offs you considered.' },
    { id: 't2', question: 'How would you design a URL shortener like bit.ly that handles millions of requests per day?', difficulty: 'hard', hint: 'Cover: hashing, database choice, caching, load balancing, and analytics.' },
    { id: 't3', question: 'Explain the difference between REST and GraphQL. When would you choose one or the other?', difficulty: 'medium', hint: 'Focus on real use cases, not textbook definitions. Discuss trade-offs.' },
    { id: 't4', question: 'How would you optimize a slow database query that takes 10+ seconds to execute?', difficulty: 'hard', hint: 'Talk about EXPLAIN ANALYZE, indexing strategies, query rewriting, and caching.' },
    { id: 't5', question: 'What is the difference between horizontal and vertical scaling? Give examples of when each is appropriate.', difficulty: 'medium', hint: 'Discuss stateless vs stateful services and cost considerations.' },
    { id: 't6', question: 'How does React\'s virtual DOM work and why does it matter for performance?', difficulty: 'medium', hint: 'Explain reconciliation, diffing, and when it actually hurts performance.' },
  ],
  Leadership: [
    { id: 'l1', question: 'Tell me about a time you led a project where things went off the rails. How did you recover?', difficulty: 'hard', hint: 'Show accountability, decisive action, and clear communication under pressure.' },
    { id: 'l2', question: 'How do you handle situations where your team strongly disagrees with your technical decision?', difficulty: 'medium', hint: 'Show how you balance listening, data-driven decisiveness, and team buy-in.' },
    { id: 'l3', question: 'Describe your approach to giving critical feedback to a peer or direct report.', difficulty: 'medium', hint: 'Use a specific framework (e.g., SBI) and speak from your own experience.' },
    { id: 'l4', question: 'How do you motivate a team that is burned out or disengaged?', difficulty: 'hard', hint: 'Show empathy, systemic thinking, and how you address root causes not just symptoms.' },
    { id: 'l5', question: 'Tell me about a time you had to make a difficult decision with incomplete information.', difficulty: 'hard', hint: 'Highlight how you gathered just enough signal, made the call, and monitored outcomes.' },
  ],
  Product: [
    { id: 'p1', question: 'How would you improve Spotify\'s onboarding experience for new users?', difficulty: 'hard', hint: 'Define the target user, identify friction points, propose changes, then define success metrics.' },
    { id: 'p2', question: 'Walk me through how you would prioritize a backlog with 50 features and a 3-person team.', difficulty: 'medium', hint: 'Mention prioritization frameworks like RICE, MoSCoW, or user impact vs effort.' },
    { id: 'p3', question: 'A key metric drops 20% overnight. Walk me through your debugging process.', difficulty: 'hard', hint: 'Discuss segmentation, funnel analysis, external factors, and cross-team coordination.' },
    { id: 'p4', question: 'How would you define the success metrics for launching a new feature?', difficulty: 'medium', hint: 'Talk about leading indicators, lagging indicators, guardrail metrics, and instrumentation.' },
    { id: 'p5', question: 'If you had to kill one feature in a product you love, which would it be and why?', difficulty: 'medium', hint: 'Shows product thinking, prioritization instinct, and ability to make hard calls.' },
  ]
}

export function getQuestionsByCategory(category) {
  return QUESTION_BANK[category] || QUESTION_BANK.Behavioral
}

export function getRandomQuestion(category) {
  const questions = getQuestionsByCategory(category)
  return questions[Math.floor(Math.random() * questions.length)]
}

export const DIFFICULTY_COLORS = {
  easy: 'text-accent-green bg-accent-green/10 border-accent-green/20',
  medium: 'text-accent-amber bg-accent-amber/10 border-accent-amber/20',
  hard: 'text-accent-rose bg-accent-rose/10 border-accent-rose/20',
}

# MockMate: Question Handling & AI Generation Architecture

## 1. Question Structure & Data Models

### Static Question Bank (`src/data/questions.js`)
```javascript
QUESTION_BANK = {
  Behavioral: {...},  // 6 questions
  Technical: {...},   // 6 questions
  Leadership: {...},  // 5 questions
  Product: {...}      // 5 questions
}
```

**Question Object Schema:**
```javascript
{
  id: string,           // e.g., 'b1', 't2', 'l3'
  question: string,     // The main question text
  difficulty: string,   // 'easy' | 'medium' | 'hard'
  hint: string,         // Guidance on strong answer structure
  followUp?: string     // Optional follow-up question
}
```

**Categories:** Behavioral, Technical, Leadership, Product  
**Total:** 22+ static, curated questions with difficulty ratings and STAR-method hints

---

## 2. Question Generation: 3-Tier Layered Approach

### **Tier 0: Offline Template Generation** (Primary → Fastest & Most Reliable)
**File:** `frontend/src/lib/questionGenerator.js`  
**Approach:** Zero-API fallback using template substitution

```typescript
generateFromProfile(profile, category, count)
  → Uses 10 templates per category
  → Substitutes resume fields (skills, tools, projects, experience)
  → Returns instantly, no network required
  → Example template: "Tell me about a time you used ${skills[random]} in a high-pressure situation"
```

**Template Libraries Per Category:**
- **Behavioral:** Focus on STAR method, real experiences, outcomes
- **Technical:** Depth, trade-offs, production systems, debugging
- **Leadership:** Influence, conflict resolution, team dynamics
- **Product:** User personas, prioritization frameworks, metrics

### **Tier 1: Gemini Direct API** (Fast, Personalized)
**File:** `frontend/src/lib/gemini.js`  
**Single Optimized Call:** `analyzeResumeAndGenerateQuestions()`

```typescript
Input:  resumeText, category, count
Output: { profile, questions[], skills[], experience[] }

Key Features:
- Key rotation & model fallback (supports gemini-2.0-flash and fallbacks)
- Up to 25 retries with exponential backoff
- Automatic rate-limit handling
- Multiple API keys support via geminiKeyManager
```

### **Tier 2: Backend API** (Stateful, Non-Repetition)
**Endpoint:** `POST /api/questions/generate`  
**File:** `backend/routes/questions.js`

```typescript
Request:
{
  resumeData: { skills[], projects[], experience[], tools[], targetRole, achievements[] },
  category: string,
  count: number
}

Response:
{
  success: boolean,
  questions: [
    {
      id: string,
      question: string,
      category: string,
      difficulty: 'easy|medium|hard',
      hint: string,
      followUp: string
    }
  ]
}

Features:
- Tracks recently generated questions (Set with max 50 entries)
- Prevents repetition across requests
- Category-specific prompting with real-world scenario focus
```

### **Tier 3: Static Fallback** (Always Works)
Returns curated static questions from `questions.js` if all other tiers fail.

---

## 3. Resume Analysis & AI Integration

### **Resume Upload & Analysis**
**Files:** `backend/routes/resume.js` + `frontend/src/lib/resumeAnalysis.js`

**Flow:**
```
User Upload → Parse Resume → Extract Profile → Store Sessionn
                                    ↓
                          Gemini Analysis
                          (targetRole, skills, 
                           experience, strengths)
```

**Extracted Profile Structure:**
```javascript
{
  name: string,
  targetRole: string,
  skills: string[],
  tools: string[],
  experience: string[],
  strengths: string[],
  projects: { name, description, tech }[],
  difficultyLevel: 'Beginner|Intermediate|Advanced'
}
```

**Storage:**
- `sessionStorage.mockmate_resume` (Frontend) — persists during session
- Can be used to generate category-specific questions dynamically

---

## 4. Answer Analysis & Feedback  

**Endpoint:** `POST /api/analyze`  
**File:** `backend/routes/analyze.js`

### **Automatic Scoring Heuristics:**
```
Base Score: 20/100

PENALTIES:
  - < 15 words: -15 pts (extremely poor)
  - < 25 words: -25 pts (poor)
  - < 50 words: -10 pts (below average)
  - Excessive fillers (um, like, basically): -15 to -25 pts
  - Vague language: -20 to -30 pts
  - No structure/fragments: -25 pts

BONUSES (only if wordCount ≥ 100):
  - 200+ words: +30 pts
  - 150+ words: +25 pts
  - 100+ words: +15 pts
  - With metrics: +20 pts
  - With action verbs: +12 pts
  - Specific examples: +18 pts
  - Good sentence structure: +20 pts

Result: 0-100 scale
```

### **Detailed Feedback Generation:**
- Identifies specific issues (length, structure, clarity)
- Detects filler words, vague language, missing metrics
- Provides actionable suggestions
- Scores multiple dimensions:
  - Clarity, Structure, Confidence, Relevance
  - English grammar, Fluency
  - STAR method compliance

---

## 5. Practice Page Flow (`frontend/src/pages/PracticePage.jsx`)

### **State Management:**
```javascript
category        → User's selected interview category
resumeData      → Extracted resume profile
questions       → Current batch of questions
questionIdx     → Index in question array
answer          → User's spoken/typed response
mode            → 'speak' | 'type'
analyzing       → Loading state for AI analysis
questionsGenerated → Flag for resume-based generation
```

### **Question Loading Logic:**
```
Mount Component
    ↓
Check sessionStorage for saved resume
    ↓
If resume exists:
    → For each category change:
       - Trigger Tier 0 (Template Generation)
       - If fails → Tier 1 (Gemini Direct)
       - If fails → Tier 3 (Static Bank)
Else:
    → Load static questions from bank
```

### **Answer Flow:**
```
User speaks/types answer
    ↓
Timer starts on first input
    ↓
User clicks "Analyze"
    ↓
POST /api/analyze
    → Score & detailed feedback via Gemini
    ↓
Save to sessionStorage (mockmate_last_analysis)
    ↓
Save to DB via /api/sessions
    ↓
Navigate to /results page
```

### **Voice/Text Modes:**
- **Voice**: VoiceRecorder component → transcribes to text
- **Text**: Direct textarea input
- Both modes trigger same analysis pipeline

---

## 6. API Endpoints Summary

### **Backend Routes**

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/questions/generate` | POST | Generate personalized questions from resume | `{ questions[], success }` |
| `/api/analyze` | POST | Score & analyze single answer | `{ analysis, success }` |
| `/api/resume/upload` | POST | Upload & parse resume | `{ parsed, success }` |
| `/api/sessions` | POST | Save practice session | `{ sessionId, success }` |
| `/api/auth/*` | Various | Authentication (register, login, MFA) | Token-based |
| `/health` | GET | Service health check | `{ status, timestamp }` |

### **Frontend API Layer (`src/lib/api.js`)**

```typescript
// High-level exports:
uploadResume(file, userId)
analyzeResume(resumeText)                    // CALL 1
generateQuestionsFromAnalysis(profile, cat, count)
generateQuestions(resumeData, category, count)
analyzeAnswer(questionData)                  // CALL 2
saveSession(sessionData)

// With 3-tier fallback (Template → Gemini → Backend → Static)
```

---

## 7. Gemini API Optimization

### **Key Management (`src/lib/geminiKeyManager.js`)**
- Supports multiple API keys
- Tracks success/failure per key
- Automatic key rotation on auth errors or quota exhaustion
- Max 3 retries per key before rotation

### **Model Fallback Chain:**
```
gemini-2.0-flash (preferred)
    ↓ (if not supported)
gemini-2.0-flash-lite
    ↓ (if rate-limited)
gemini-1.5-flash-latest
    ↓ (fallback)
gemini-1.5-flash
    ↓ (legacy)
gemini-pro
```

### **Rate Limiting Strategy:**
- 429 (Quota): Rotate key + model, wait 500ms
- 401/403 (Auth): Mark key as invalid, switch to next
- Network errors: Retry with exponential backoff
- Max 25 total retries across all keys/models

---

## 8. Question Generation Workflow (Complete)

```
┌─────────────────────────────────────────────────────┐
│ User selects Category on Practice Page              │
│ (Resume context available from sessionStorage)      │
└────────────────┬────────────────────────────────────┘
                 ↓
    ┌────────────────────────────────┐
    │ Tier 0: Template Generation    │
    │ (Instant, offline, guaranteed) │
    │ generateFromProfile()           │
    └────────────┬───────────────────┘
                 ↓ (If no profile)
    ┌────────────────────────────────┐
    │ Tier 1: Gemini Direct API      │
    │ analyzeResumeAndGenerateQuestions()
    │ (Fast, personalized, key rotation)
    └────────────┬───────────────────┘
                 ↓ (If Gemini unavailable)
    ┌────────────────────────────────┐
    │ Tier 2: Backend API            │
    │ POST /api/questions/generate   │
    │ (Stateful, prevents repetition)│
    └────────────┬───────────────────┘
                 ↓ (If backend fails)
    ┌────────────────────────────────┐
    │ Tier 3: Static Question Bank   │
    │ (Always works, fallback only)  │
    └────────────┬───────────────────┘
                 ↓
    ┌────────────────────────────────┐
    │ Display Questions to User      │
    │ (Show feedback & timer)         │
    └────────────────────────────────┘
```

---

## 9. Key Features & Design Decisions

### **Resilience:**
- ✅ 3-tier fallback ensures questions always available
- ✅ Offline template generation never requires API
- ✅ Key rotation handles quota exhaustion
- ✅ Model fallback stack supports deprecated models

### **Personalization:**
- ✅ Resume parsing extracts skills, experience, projects
- ✅ Templates substituted with resume fields
- ✅ Category-specific AI prompting
- ✅ Difficulty mixing (easy/medium/hard balance)

### **Performance:**
- ✅ Template generation: ~0ms (instant)
- ✅ Gemini direct: ~2-5s (fast)
- ✅ Backend: ~3-8s (slightly slower, stateful)
- ✅ Static fallback: ~0ms

### **Non-Repetition:**
- ✅ Backend tracks recent 50 questions per session
- ✅ Excluded from next generations
- ✅ Frontend passes exclusion list in Gemini prompts

### **Scoring & Feedback:**
- ✅ Heuristic scoring (0-100) based on content quality
- ✅ Detailed feedback with specific issues identified
- ✅ STAR method compliance checking
- ✅ Multiple dimension scoring (clarity, structure, confidence, etc.)

---

## 10. Data Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│ FRONTEND                                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  PracticePage.jsx                                       │
│  ├─ Resume Upload → sessionStorage.mockmate_resume    │
│  ├─ Category Selection                                 │
│  └─ Generate Questions (3-tier)                        │
│                                                          │
│  VoiceRecorder / TextInput                             │
│  ├─ Record/Type Answer                                 │
│  └─ Send to Backend /api/analyze                       │
│                                                          │
│  ResultsPage.jsx                                        │
│  └─ Display Score & Feedback                           │
│                                                          │
└────────────┬────────────────────────────────────────────┘
             │ HTTP Requests
             ↓
┌──────────────────────────────────────────────────────────┐
│ BACKEND (Express.js)                                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  /api/questions/generate                               │
│  ├─ Input: resumeData + category                       │
│  ├─ Gemini API call                                    │
│  └─ Response: personalized questions                   │
│                                                          │
│  /api/analyze                                          │
│  ├─ Input: question + answer                           │
│  ├─ Gemini Evaluation Call                             │
│  ├─ Heuristic Scoring                                  │
│  └─ Response: score + feedback                         │
│                                                          │
│  /api/resume/upload                                    │
│  └─ Parse & extract profile                            │
│                                                          │
│  /api/sessions                                         │
│  └─ Save session data                                  │
│                                                          │
└────────────┬────────────────────────────────────────────┘
             │ API Calls
             ↓
┌──────────────────────────────────────────────────────────┐
│ EXTERNAL SERVICES                                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Google Gemini API                                      │
│  ├─ analyzeResumeAndGenerateQuestions()                │
│  ├─ evaluateAllAnswers()                               │
│  └─ Multiple model fallback                            │
│                                                          │
│  Database (Supabase/Prisma)                           │
│  ├─ Store sessions                                    │
│  └─ User management                                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Summary

MockMate uses a **resilient, multi-tier architecture** for question generation:

1. **Questions** are 22+ static + AI-generated personalized questions
2. **Gemini API** provides intelligent analysis via optimized single calls with key/model rotation
3. **Resume Analysis** extracts profile and enables personalization
4. **Generation Flow** follows 3-tier approach: Templates → Gemini → Backend → Static
5. **Answer Analysis** combines heuristic scoring with AI-powered feedback
6. **API Endpoints** provide question generation, analysis, and session management

The system prioritizes **reliability** (3 backup tiers), **performance** (instant templates), and **personalization** (resume integration) while gracefully degrading when external APIs are unavailable.

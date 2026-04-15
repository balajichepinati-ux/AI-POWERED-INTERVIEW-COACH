# 🎯 MockMate - AI-Powered Interview Prep Platform

> Transform your interview preparation with AI-driven mock interviews, resume analysis, and personalized feedback.

## 🌟 Features

### 🤖 AI-Powered Interview Engine
- **Smart Question Generation**: Dynamic questions based on your resume and experience level
- **Real-time Feedback**: Instant AI evaluation of your interview answers
- **STAR Method Coaching**: Get structured feedback using the STAR (Situation, Task, Action, Result) framework
- **Personalized Study Plan**: Customized interview prep roadmap based on your performance

### 📊 Resume Analysis
- **Comprehensive Analysis**: AI-powered resume review and scoring
- **ATS Optimization**: Tips to improve your resume for Applicant Tracking Systems
- **Skills Assessment**: Identify gaps and areas for improvement
- **Session Dashboard**: Track your interview prep progress over time

### 🎙️ Multiple Interview Modes
- **Technical Interviews**: Algorithm, system design, and coding questions
- **Behavioral Interviews**: Situational and behavioral assessment questions
- **HR Rounds**: General and HR-specific interview questions
- **Custom Questions**: Upload your own interview questions

### 📈 Progress Tracking
- **Performance Charts**: Visualize your improvement over time
- **Score History**: Track scores across different interview sessions
- **Detailed Analytics**: See breakdown by question type and skill

### 🎨 Beautiful UI/UX
- **3D Glassmorphic Design**: Modern, immersive user interface
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Support**: Easy on the eyes, available 24/7
- **Smooth Animations**: Delightful micro-interactions throughout

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Next-gen build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful SVG icons
- **CSS 3D Transforms** - For glassmorphic effects

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma** - ORM for database
- **PostgreSQL** - Primary database

### AI/ML
- **Google Gemini Pro** - AI language model
- **Multi-Key API Management** - 5 API keys with automatic failover
- **Smart Retry Logic** - Automatic rotation on key expiration
- **Usage Tracking** - Monitor API consumption

### Authentication
- **Supabase Auth** - Secure authentication
- **JWT Tokens** - Stateless session management
- **Email Verification** - Optional two-factor security

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database
- Google Gemini API keys

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/MockMate.git
cd MockMate
```

2. **Set up environment variables**

**Backend** - `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost/mockmate
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=eyJhbGc...
NODE_ENV=development
PORT=3001
```

**Frontend** - `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_KEY=eyJhbGc...
# Optional: Override Gemini key (if not provided, uses 5 default keys)
# VITE_GEMINI_API_KEY=AIzaSy...
```

3. **Install dependencies**

```bash
# Backend
cd backend
npm install
npx prisma migrate deploy

# Frontend
cd ../frontend
npm install
```

4. **Start the servers**

```bash
# Run both in separate terminals:

# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit http://localhost:5173 to see the app!

## 📚 Documentation

### Getting Started
- [Setup Guide](./GEMINI_SETUP.md) - Detailed Gemini API setup
- [Quick Start](./GEMINI_QUICKSTART.md) - Get running in 5 minutes
- [Configuration Guide](./README.md) - Environment & config details

### API & Integration
- [API Key Rotation System](./GEMINI_API_KEY_ROTATION.md) - How automatic failover works
- [Implementation Guide](./GEMINI_IMPLEMENTATION_GUIDE.md) - Technical architecture
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Production readiness

### Development
- [Architecture Overview](#-architecture) - System design
- [API Reference](#-api-reference) - Backend endpoints
- [Contributing](#-contributing) - Development guidelines

## 🏗️ Architecture

### System Overview
```
┌─────────────────────────────────────────┐
│         React Frontend (Vite)           │
│  ├── Dashboard                          │
│  ├── Practice Pages                     │
│  ├── Results & Analytics                │
│  └── Settings & Profile                 │
└──────────────┬──────────────────────────┘
               │ REST API
               ↓
┌─────────────────────────────────────────┐
│      Express Backend (Node.js)          │
│  ├── /api/auth - Authentication        │
│  ├── /api/questions - Q.Generation     │
│  ├── /api/analyze - Resume Analysis    │
│  ├── /api/sessions - Session Mgmt      │
│  └── /api/resume - Resume Upload       │
└──────────────┬──────────────────────────┘
               │
      ┌────────┼────────┐
      ↓        ↓        ↓
   ┌──────┐ ┌──────┐ ┌────────────┐
   │  DB  │ │Cache │ │Gemini API  │
   └──────┘ └──────┘ │(5 keys)    │
                     └────────────┘
```

### Component Architecture
```
MockMate/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities & services
│   │   │   ├── gemini.js   # AI service
│   │   │   ├── geminiKeyManager.js  # Key rotation
│   │   │   └── api.js      # API client
│   │   ├── hooks/          # Custom React hooks
│   │   │   └── useGeminiApiStatus.js  # Status monitoring
│   │   ├── context/        # React context
│   │   └── App.jsx         # Main app
│   └── package.json
│
├── backend/
│   ├── routes/             # API routes
│   ├── prisma/             # Database schema
│   ├── server.js           # Express server
│   └── package.json
│
└── docs/                   # Documentation
    ├── GEMINI_SETUP.md
    ├── GEMINI_API_KEY_ROTATION.md
    └── DEPLOYMENT_CHECKLIST.md
```

## 🔄 API Key Rotation System

Your MockMate instance includes an intelligent **5-key failover system** for Google Gemini API:

### How It Works
1. **5 Backup Keys**: System has 5 API keys configured
2. **Automatic Rotation**: Switches to next key when current one fails
3. **Smart Retry Logic**: Retries up to 5 times with different keys
4. **Usage Tracking**: Monitors requests and errors per key
5. **Manual Control**: Reset keys manually if needed

### Your API Keys (Pre-configured)
```javascript
// In frontend/src/lib/geminiKeyManager.js
const API_KEYS = [
  'AIzaSyCHRr8fVIVkCRWhH8mdvrCUMgoqlMSfWnE',
  'AIzaSyBeVVSC9LrHGu4xA2AqBv9ikW-Ya-2_cdo',
  'AIzaSyDre2zAUomOR2Lz4OBkXyH-IhuwZ7q0GBc',
  'AIzaSyD3zd2fy_bejXRiOCTJdMiCDotzukpjdIc',
  'AIzaSyB1XGK1nC_FHF7XNIFivlmhQzulVfWqT5g',
]
```

### Monitoring
Check API status in browser console:
```javascript
import GeminiService from './lib/gemini'
GeminiService.getApiStats()
// Returns: current key, failed keys, usage stats, ready status
```

See [GEMINI_API_KEY_ROTATION.md](./GEMINI_API_KEY_ROTATION.md) for full details.

## 📡 API Reference

### Authentication Endpoints
```
POST   /api/auth/signup           - Create account
POST   /api/auth/login            - Login
POST   /api/auth/logout           - Logout
GET    /api/auth/me               - Current user
```

### Interview Endpoints
```
POST   /api/questions/generate    - Generate questions
POST   /api/analyze/answer        - Evaluate answer
GET    /api/sessions              - Get all sessions
GET    /api/sessions/:id          - Get session details
POST   /api/sessions/:id/save     - Save session
```

### Resume Endpoints
```
POST   /api/resume/upload         - Upload resume
POST   /api/resume/analyze        - Analyze resume
GET    /api/resume/score          - Get resume score
```

See [GEMINI_SETUP.md](./GEMINI_SETUP.md) for detailed API documentation.

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# End-to-end tests
npm run test:e2e
```

### Manual Testing Checklist
- [ ] Sign up with new account
- [ ] Upload resume (PDF or text)
- [ ] Generate interview questions
- [ ] Practice with a question
- [ ] Receive AI feedback
- [ ] Check performance dashboard
- [ ] Try different interview types

## 📦 Deployment

### Production Build

```bash
# Frontend build
cd frontend
npm run build
# Output: dist/ folder (ready for hosting)

# Backend
cd backend
npm run build
# Or use with PM2/Docker
```

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy backend
cd backend && vercel deploy

# Deploy frontend
cd frontend && vercel deploy
```

### Deploy to Traditional Server

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for step-by-step instructions.

## 🔐 Security

### Environment Variables
- Never commit `.env` or `.env.local` files
- Use `.env.example` template
- Rotate API keys monthly
- Use strong database passwords

### API Security
- CORS configured for allowed domains
- Rate limiting enabled
- SQL injection prevention via Prisma ORM
- XSS protection via React

### Database
- SSL/TLS for connections
- Regular backups
- IP whitelisting (if possible)
- Minimal privilege accounts

## 📊 Monitoring & Analytics

### API Usage Monitoring
```javascript
// Check every 5 seconds via React hook
import { useGeminiApiStatus } from '@/hooks/useGeminiApiStatus'

const { stats, isReady, totalRequests, totalErrors } = useGeminiApiStatus()
```

### Performance Monitoring
- Monitor page load time < 3 seconds
- API response time < 10 seconds
- Error rate < 1%

### Usage Tracking
Visit: https://makersuite.google.com/app/usage
- Monitor token consumption
- Track remaining quota
- Plan for additional keys

## 🐛 Troubleshooting

### Questions not generating?
```javascript
// Check in browser console
GeminiService.isReady()  // Should return true
GeminiService.getApiStats()  // Check if keys available
```

### Getting rate limit errors?
- Reduce request frequency
- Wait 24 hours (quota resets)
- Add more API keys
- Implement caching

### All keys failed?
- Check keys at https://makersuite.google.com
- Reset keys: `GeminiService.resetAllApiKeys()`
- Add new keys from Google AI Studio

See [GEMINI_QUICKSTART.md](./GEMINI_QUICKSTART.md) for more troubleshooting tips.

## 📈 Performance Optimization

### Frontend
- ✅ Code splitting with Vite
- ✅ Lazy loading for routes
- ✅ CSS minification
- ✅ Image optimization

### Backend
- ✅ Database query optimization
- ✅ Connection pooling
- ✅ Response caching
- ✅ Compression enabled

### API
- ✅ Multi-key failover system
- ✅ Automatic retry logic
- ✅ Result caching
- ✅ Load balancing (with 5 keys)

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint rules (`npm run lint`)
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Keep PRs focused and small

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💬 Contact & Support

- **Email**: support@mockmate.com
- **Twitter**: [@mockmate](https://twitter.com/mockmate)
- **Issues**: [GitHub Issues](https://github.com/mockmate/issues)

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- React & Vite communities
- All contributors and users

## 📚 Additional Resources

- [Google Gemini Documentation](https://ai.google.dev)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [Prisma ORM Docs](https://www.prisma.io)
- [Tailwind CSS](https://tailwindcss.com)

---

<div align="center">

### 🚀 Ready to ace your interviews?

[Get Started](./GEMINI_QUICKSTART.md) | [Documentation](./GEMINI_API_KEY_ROTATION.md) | [Deploy](./DEPLOYMENT_CHECKLIST.md)

**Made with ❤️ by the MockMate Team**

</div>

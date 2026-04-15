#!/bin/bash

# MockMate Pipeline Verification Script
# Run this after starting both backend and frontend

echo "🧪 MockMate Pipeline Verification"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Health
echo "1️⃣ Testing Backend Health..."
HEALTH=$(curl -s http://localhost:3001/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend not responding${NC}"
    echo "   Make sure to run: cd backend && npm start"
    exit 1
fi
echo ""

# Test 2: Resume Analysis Endpoint
echo "2️⃣ Testing Resume Analysis Endpoint..."
RESUME_TEST=$(curl -s -X POST http://localhost:3001/api/analyze/resume \
  -H "Content-Type: application/json" \
  -d '{"resumeText":"John Doe. Senior Software Engineer with 5 years experience in React and Node.js"}')

if echo "$RESUME_TEST" | grep -q "analysis"; then
    echo -e "${GREEN}✅ Resume analysis endpoint working${NC}"
    echo "   Response: $(echo $RESUME_TEST | head -c 100)..."
else
    echo -e "${YELLOW}⚠️ Resume analysis endpoint issue${NC}"
    echo "   Response: $RESUME_TEST"
fi
echo ""

# Test 3: Questions Generation Endpoint
echo "3️⃣ Testing Questions Generation Endpoint..."
QUESTIONS_TEST=$(curl -s -X POST http://localhost:3001/api/questions/generate \
  -H "Content-Type: application/json" \
  -d '{
    "resumeData": {
      "skills": ["React", "Node.js"],
      "tools": ["TypeScript"],
      "targetRole": "Full Stack Developer",
      "projects": []
    },
    "category": "Technical",
    "count": 3
  }')

if echo "$QUESTIONS_TEST" | grep -q "questions"; then
    echo -e "${GREEN}✅ Questions generation endpoint working${NC}"
    echo "   Questions returned: $(echo $QUESTIONS_TEST | grep -o '"question"' | wc -l)"
else
    echo -e "${YELLOW}⚠️ Questions generation endpoint issue${NC}"
    echo "   Response: $QUESTIONS_TEST"
fi
echo ""

# Test 4: Answer Analysis Endpoint
echo "4️⃣ Testing Answer Analysis Endpoint..."
ANSWER_TEST=$(curl -s -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Tell me about a challenging project you led",
    "answer": "I led a team of 5 engineers to build a real-time collaboration platform using React and Node.js. We faced a challenge with WebSocket scalability but solved it by implementing server-side load balancing.",
    "category": "Behavioral"
  }')

if echo "$ANSWER_TEST" | grep -q "overallScore"; then
    echo -e "${GREEN}✅ Answer analysis endpoint working${NC}"
    SCORE=$(echo $ANSWER_TEST | grep -o '"overallScore":[0-9]*' | grep -o '[0-9]*')
    echo "   Sample score: $SCORE/100"
else
    echo -e "${YELLOW}⚠️ Answer analysis endpoint issue${NC}"
    echo "   Response: $ANSWER_TEST"
fi
echo ""

# Test 5: Frontend Available
echo "5️⃣ Testing Frontend..."
FRONTEND=$(curl -s http://localhost:5173/)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend is running on port 5173${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend not responding on 5173${NC}"
    echo "   Make sure to run: cd frontend && npm run dev"
fi
echo ""

echo "=================================="
echo "✨ Pipeline verification complete!"
echo ""
echo "Next steps:"
echo "1. Go to http://localhost:5173/resume"
echo "2. Upload your resume"
echo "3. Go to /practice and select a category"
echo "4. Answer a question"
echo "5. Check your results!"
echo ""

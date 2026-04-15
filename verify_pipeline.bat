@echo off
REM MockMate Pipeline Verification Script for Windows
REM Run this after starting both backend and frontend

echo.
echo 🧪 MockMate Pipeline Verification
echo ===================================
echo.

REM Test 1: Backend Health
echo 1️⃣ Testing Backend Health...
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running
) else (
    echo ❌ Backend not responding
    echo    Make sure to run: cd backend ^&^& npm start
    exit /b 1
)
echo.

REM Test 2: Resume Analysis Endpoint
echo 2️⃣ Testing Resume Analysis Endpoint...
curl -s -X POST http://localhost:3001/api/analyze/resume ^
  -H "Content-Type: application/json" ^
  -d "{\"resumeText\":\"John Doe. Senior Software Engineer with 5 years experience in React and Node.js\"}" | find "analysis" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Resume analysis endpoint working
) else (
    echo ⚠️ Resume analysis endpoint issue - check backend logs
)
echo.

REM Test 3: Questions Generation Endpoint
echo 3️⃣ Testing Questions Generation Endpoint...
curl -s -X POST http://localhost:3001/api/questions/generate ^
  -H "Content-Type: application/json" ^
  -d "{\"resumeData\":{\"skills\":[\"React\",\"Node.js\"],\"tools\":[\"TypeScript\"],\"targetRole\":\"Full Stack Developer\",\"projects\":[]},\"category\":\"Technical\",\"count\":3}" | find "questions" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Questions generation endpoint working
) else (
    echo ⚠️ Questions generation endpoint issue - check backend logs
)
echo.

REM Test 4: Answer Analysis Endpoint
echo 4️⃣ Testing Answer Analysis Endpoint...
curl -s -X POST http://localhost:3001/api/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"question\":\"Tell me about a challenging project you led\",\"answer\":\"I led a team of 5 engineers to build a real-time collaboration platform using React and Node.js.\",\"category\":\"Behavioral\"}" | find "overallScore" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Answer analysis endpoint working
) else (
    echo ⚠️ Answer analysis endpoint issue - check backend logs
)
echo.

REM Test 5: Frontend Available
echo 5️⃣ Testing Frontend...
curl -s http://localhost:5173/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is running on port 5173
) else (
    echo ⚠️ Frontend not responding on 5173
    echo    Make sure to run: cd frontend ^&^& npm run dev
)
echo.

echo ===================================
echo ✨ Pipeline verification complete!
echo.
echo Next steps:
echo 1. Go to http://localhost:5173/resume
echo 2. Upload your resume
echo 3. Go to /practice and select a category
echo 4. Answer a question
echo 5. Check your results!
echo.
pause

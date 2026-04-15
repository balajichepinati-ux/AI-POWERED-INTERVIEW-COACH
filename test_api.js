/**
 * Test Script to verify Gemini API Key is working
 * and generate sample questions
 */

require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('='.repeat(60));
console.log('🔍 GEMINI API KEY TEST');
console.log('='.repeat(60));

// ── Step 1: Check if API key is configured
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is NOT configured in .env file');
  process.exit(1);
}

console.log('✅ API Key found:', GEMINI_API_KEY.substring(0, 10) + '...');
console.log('');

// ── Step 2: Test direct API call
async function testGeminiAPI() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `Generate 3 interview questions for a Software Engineer with experience in React and Node.js.
  Return ONLY valid JSON array (no markdown, no other text):
  [
    {
      "id": "q1",
      "question": "Question text here",
      "difficulty": "medium",
      "hint": "Brief hint"
    }
  ]`;

  try {
    console.log('📡 Sending request to Gemini API...');
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
        }
      })
    });

    if (response.status === 401 || response.status === 403) {
      console.error('❌ API Key Error: Invalid or expired key');
      const error = await response.json();
      console.error('Details:', error);
      return false;
    }

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ API Error (${response.status}):`, error.error?.message || error);
      return false;
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error('❌ No response text from API');
      return false;
    }

    console.log('✅ API Response Received!');
    console.log('');
    console.log('📝 Generated Content:');
    console.log('-'.repeat(60));
    
    // Try to parse and display the questions
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const questions = JSON.parse(jsonMatch[0]);
        console.log(JSON.stringify(questions, null, 2));
        console.log('-'.repeat(60));
        console.log(`✅ Successfully parsed ${questions.length} questions`);
        return true;
      } catch (e) {
        console.log(responseText.substring(0, 500));
        console.log('(truncated...)');
        return true;
      }
    }

    return true;
  } catch (err) {
    console.error('❌ Network/Connection Error:', err.message);
    return false;
  }
}

// ── Step 3: Test backend endpoint
async function testBackendEndpoint() {
  const resume = {
    skills: ['React', 'Node.js', 'JavaScript'],
    tools: ['Git', 'Docker', 'PostgreSQL'],
    projects: ['E-commerce Platform', 'Task Management App'],
    experience: [{ role: 'Software Engineer', company: 'Tech Corp' }],
    targetRole: 'Senior Software Engineer'
  };

  try {
    console.log('');
    console.log('📡 Testing Backend Question Generation Endpoint...');
    console.log('-'.repeat(60));
    
    const response = await fetch('http://localhost:3001/api/questions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeData: resume,
        category: 'Technical',
        count: 5
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Backend Error (${response.status}):`, error);
      return false;
    }

    const data = await response.json();
    
    if (data.success && data.questions) {
      console.log(`✅ Backend returned ${data.questions.length} questions`);
      console.log('');
      console.log('Sample Question:');
      console.log(JSON.stringify(data.questions[0], null, 2));
      return true;
    } else {
      console.error('❌ Backend response invalid:', data);
      return false;
    }
  } catch (err) {
    console.error('❌ Backend Connection Error:', err.message);
    console.log('   (Make sure backend is running on port 3001)');
    return false;
  }
}

// ── Run tests
(async () => {
  const apiWorks = await testGeminiAPI();
  
  if (apiWorks) {
    console.log('');
    console.log('✅ Gemini API Key is WORKING!');
    console.log('');
    
    await testBackendEndpoint();
  } else {
    console.log('');
    console.error('❌ Gemini API Key verification FAILED');
    process.exit(1);
  }

  console.log('');
  console.log('='.repeat(60));
  process.exit(0);
})();

/**
 * Simple API Key Test - No dependencies required
 */

// Read API key from .env file
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
let GEMINI_API_KEY = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GEMINI_API_KEY=([^\n]*)/);
  if (match) {
    GEMINI_API_KEY = match[1].trim();
  }
}

console.log('\n' + '='.repeat(70));
console.log('🔍 CHECKING GEMINI API KEY');
console.log('='.repeat(70) + '\n');

if (!GEMINI_API_KEY) {
  console.error('❌ ERROR: GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

console.log('✅ API Key Found:', GEMINI_API_KEY.substring(0, 15) + '...\n');

// Test the API
async function testAPI() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const testPrompt = `Generate 2 technical interview questions for a React developer.
Return ONLY JSON array (no markdown):
[{"id":"q1","question":"Q1","difficulty":"medium"},{"id":"q2","question":"Q2","difficulty":"hard"}]`;

  try {
    console.log('📡 Testing Gemini API Connection...\n');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: testPrompt }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
      })
    });

    const data = await response.json();

    if (response.status === 401) {
      console.error('❌ AUTHENTICATION FAILED');
      console.error('   Status: 401 - Invalid or Expired API Key\n');
      console.error('   Error:', data.error?.message || 'Unknown error\n');
      process.exit(1);
    }

    if (response.status === 403) {
      console.error('❌ FORBIDDEN');
      console.error('   Status: 403 - API Key not authorized\n');
      console.error('   Error:', data.error?.message || 'Unknown error\n');
      process.exit(1);
    }

    if (!response.ok) {
      console.error(`❌ API ERROR (${response.status})`);
      console.error('   Error:', data.error?.message || data);
      process.exit(1);
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      console.error('❌ No response from API\n');
      process.exit(1);
    }

    console.log('✅ GEMINI API IS WORKING PERFECTLY!\n');
    console.log('Sample Response:');
    console.log('-'.repeat(70));
    console.log(content.substring(0, 300) + (content.length > 300 ? '...' : ''));
    console.log('-'.repeat(70) + '\n');

    console.log('✅ API KEY STATUS: VALID & ACTIVE\n');
    console.log('=' * 70);
    process.exit(0);

  } catch (err) {
    console.error('❌ CONNECTION FAILED');
    console.error('   Error:', err.message);
    console.error('\n   Possible causes:');
    console.error('   - No internet connection');
    console.error('   - Firewall/proxy blocking API calls');
    console.error('   - Invalid API key format\n');
    process.exit(1);
  }
}

testAPI();

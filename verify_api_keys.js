#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ️${colors.reset} ${msg}`),
};

async function checkBackendEnv() {
  console.log('\n' + colors.blue + '═══════════════════════════════════════' + colors.reset);
  console.log(colors.blue + 'Checking Backend Environment' + colors.reset);
  console.log(colors.blue + '═══════════════════════════════════════' + colors.reset);

  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  
  if (!fs.existsSync(backendEnvPath)) {
    log.error(`Backend .env file not found at: ${backendEnvPath}`);
    log.warning('Create backend/.env with GEMINI_API_KEY=your_key');
    return false;
  }

  const envContent = fs.readFileSync(backendEnvPath, 'utf-8');
  const lines = envContent.split('\n');
  let geminiKey = null;

  lines.forEach(line => {
    if (line.startsWith('GEMINI_API_KEY=')) {
      geminiKey = line.split('=')[1].trim();
    }
  });

  if (!geminiKey) {
    log.error('GEMINI_API_KEY not found in backend/.env');
    return false;
  }

  if (geminiKey === 'your_key_here' || geminiKey === 'your_new_key_here') {
    log.error('GEMINI_API_KEY is not set (placeholder value detected)');
    return false;
  }

  log.success(`Backend .env found`);
  log.info(`Gemini API Key: ${geminiKey.substring(0, 10)}...${geminiKey.substring(geminiKey.length - 4)}`);

  return geminiKey;
}

async function checkFrontendEnv() {
  console.log('\n' + colors.blue + '═══════════════════════════════════════' + colors.reset);
  console.log(colors.blue + 'Checking Frontend Environment' + colors.reset);
  console.log(colors.blue + '═══════════════════════════════════════' + colors.reset);

  const frontendEnvPath = path.join(__dirname, 'frontend', '.env.local');
  
  if (!fs.existsSync(frontendEnvPath)) {
    log.error(`Frontend .env.local file not found at: ${frontendEnvPath}`);
    log.warning('Create frontend/.env.local with VITE_GEMINI_API_KEY=your_key');
    return false;
  }

  const envContent = fs.readFileSync(frontendEnvPath, 'utf-8');
  const lines = envContent.split('\n');
  let geminiKey = null;
  let supabaseUrl = null;

  lines.forEach(line => {
    if (line.startsWith('VITE_GEMINI_API_KEY=')) {
      geminiKey = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
  });

  if (!geminiKey) {
    log.error('VITE_GEMINI_API_KEY not found in frontend/.env.local');
    return false;
  }

  if (geminiKey === 'your_api_key_here' || geminiKey.includes('placeholder')) {
    log.error('VITE_GEMINI_API_KEY is not set (placeholder value detected)');
    return false;
  }

  log.success(`Frontend .env.local found`);
  log.info(`Gemini API Key: ${geminiKey.substring(0, 10)}...${geminiKey.substring(geminiKey.length - 4)}`);
  
  if (supabaseUrl) {
    log.info(`Supabase URL: ${supabaseUrl}`);
  }

  return geminiKey;
}

async function testGeminiAPI(apiKey) {
  console.log('\n' + colors.blue + '═══════════════════════════════════════' + colors.reset);
  console.log(colors.blue + 'Testing Gemini API Connection' + colors.reset);
  console.log(colors.blue + '═══════════════════════════════════════' + colors.reset);

  if (!apiKey) {
    log.error('No API key available to test');
    return false;
  }

  const modelsTryInOrder = [
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-pro',
    'gemini-pro-vision'
  ];

  for (const model of modelsTryInOrder) {
    try {
      log.info(`Testing model: ${model}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Say "ok" in 1 word' }]
            }],
            generationConfig: {
              maxOutputTokens: 10,
              temperature: 0.1,
            }
          })
        }
      )
      .catch(err => ({ ok: false, status: 0, error: err.message }));

      if (response.status === 401) {
        log.error('API key is invalid or expired (401 Unauthorized)');
        return false;
      }

      if (response.status === 403) {
        log.error('Access forbidden - API key may be disabled (403 Forbidden)');
        return false;
      }

      if (response.status === 429) {
        log.success(`Gemini API is ACTIVE - Model: ${model}`);
        log.warning(`Rate limited (quota exhausted or too frequent requests)`);
        return true;
      }

      if (response.status === 404) {
        log.info(`Model ${model} - Not available`);
        continue;
      }

      if (!response.ok) {
        try {
          const error = await response.json();
          log.info(`Model ${model} - ${error.error?.message || response.statusText}`);
        } catch (e) {
          log.info(`Model ${model} - ${response.statusText || 'Error'}`);
        }
        continue;
      }

      try {
        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (generatedText) {
          log.success(`Gemini API is ACTIVE - Model: ${model}`);
          log.info(`Response: "${generatedText}"`);
          return true;
        }
      } catch (e) {
        log.info(`Model ${model} - Could not parse response`);
        continue;
      }

    } catch (error) {
      log.info(`Model ${model} - Error: ${error.message}`);
      continue;
    }
  }

  log.error('No accessible Gemini models found with this API key');
  console.log('\n' + colors.yellow + 'Troubleshooting:' + colors.reset);
  console.log('  • API key may not have model access permissions');
  console.log('  • API key quota might be exhausted');
  console.log('  • Try a new key: https://makersuite.google.com/app/apikey');
  return false;
}

async function runChecks() {
  console.log(colors.blue + '\n╔═══════════════════════════════════════╗' + colors.reset);
  console.log(colors.blue + '║  MockMate API Keys Verification Tool  ║' + colors.reset);
  console.log(colors.blue + '╚═══════════════════════════════════════╝' + colors.reset);

  const backendKey = await checkBackendEnv();
  const frontendKey = await checkFrontendEnv();
  
  let geminiWorks = false;
  if (backendKey) {
    geminiWorks = await testGeminiAPI(backendKey);
  } else if (frontendKey) {
    geminiWorks = await testGeminiAPI(frontendKey);
  }

  console.log('\n' + colors.blue + '═══════════════════════════════════════' + colors.reset);
  console.log(colors.blue + 'Summary' + colors.reset);
  console.log(colors.blue + '═══════════════════════════════════════' + colors.reset);

  const results = {
    'Backend .env configured': !!backendKey,
    'Frontend .env configured': !!frontendKey,
    'Gemini API is active': geminiWorks,
  };

  Object.entries(results).forEach(([key, value]) => {
    if (value) {
      log.success(key);
    } else {
      log.error(key);
    }
  });

  const allGood = backendKey && frontendKey && geminiWorks;

  console.log('\n' + colors.blue + '═══════════════════════════════════════' + colors.reset);
  
  if (allGood) {
    log.success('All checks passed! Your API keys are active and working.');
  } else {
    log.warning('Some checks failed. See above for details.');
  }

  process.exit(allGood ? 0 : 1);
}

runChecks();

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase only if credentials are provided
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'https://your-project.supabase.co') {
  try {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log('[Resume] Supabase configured');
  } catch (err) {
    console.warn('[Resume] Supabase initialization failed:', err.message);
  }
}

// Gemini API key from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not set in environment variables');
}

// Helper function to call Gemini API with retry
async function callGeminiAPI(prompt, retryCount = 0) {
  if (retryCount >= 3) {
    throw new Error('Gemini API failed after 3 retries');
  }

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        }
      })
    });

    if (response.status === 401 || response.status === 403) {
      console.error(`[Gemini] API key error: ${response.status}`);
      throw new Error('Invalid or expired API key');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API call failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error(`[Gemini] Error (attempt ${retryCount + 1}):`, err.message);
    if (retryCount < 2) {
      await new Promise(r => setTimeout(r, 1000));
      return callGeminiAPI(prompt, retryCount + 1);
    }
    throw err;
  }
}

// Multer config — store in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF and DOCX files are supported'));
  }
});

// Extract text from file buffer
async function extractText(buffer, mimeType, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === '.pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  } else if (ext === '.docx' || ext === '.doc') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  throw new Error('Unsupported file type');
}

// Parse resume text with Gemini
async function parseResumeWithAI(text) {
  const prompt = `Analyze this resume text and extract structured information. Return ONLY valid JSON, no markdown, no other text.

Resume text:
${text.substring(0, 8000)}

Return this exact JSON structure:
{
  "name": "candidate name or null",
  "email": "email or null",
  "skills": ["skill1", "skill2"],
  "tools": ["tool1", "tool2"],
  "languages": ["language1"],
  "frameworks": ["framework1"],
  "projects": [{"name": "project name", "description": "brief desc", "tech": ["tech1"]}],
  "experience": [{"role": "job title", "company": "company", "duration": "dates", "highlights": ["point1"]}],
  "education": [{"degree": "degree", "institution": "school", "year": "year"}],
  "achievements": ["achievement1"],
  "targetRole": "inferred target role based on background"
}`;

  try {
    const responseText = await callGeminiAPI(prompt);
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('[Resume Parse Error]', err.message);
    // Fallback: return basic structure
    return {
      skills: [],
      tools: [],
      projects: [],
      experience: [],
      education: [],
      achievements: [],
      targetRole: 'Software Developer'
    };
  }
}

// POST /api/resume/upload
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { userId } = req.body;
    const buffer = req.file.buffer;
    const originalName = req.file.originalname;

    // Extract text
    const extractedText = await extractText(buffer, req.file.mimetype, originalName);

    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({ error: 'Could not extract text from resume. Please try a different file.' });
    }

    // Parse with AI
    const parsed = await parseResumeWithAI(extractedText);

    // Upload to Supabase Storage (if userId provided and Supabase configured)
    let fileUrl = null;
    if (userId && process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'https://your-project.supabase.co') {
      try {
        const fileName = `${userId}/${Date.now()}-${originalName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, buffer, { contentType: req.file.mimetype });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(fileName);
          fileUrl = publicUrl;
        }
      } catch (storageErr) {
        console.warn('[Storage Warning]', storageErr.message);
      }
    }

    res.json({
      success: true,
      resume: {
        fileName: originalName,
        fileUrl,
        extractedText: extractedText.substring(0, 5000),
        parsed,
        wordCount: extractedText.split(/\s+/).length
      }
    });

  } catch (err) {
    console.error('[Resume Upload Error]', err);
    res.status(500).json({ error: err.message || 'Failed to process resume' });
  }
});

module.exports = router;

// ─── Vertex AI / Gemini Init ──────────────────────────────────────────────────
const { VertexAI } = require('@google-cloud/vertexai');

const PROJECT_ID = process.env.GCP_PROJECT_ID || 'kitahack-tehais';
const LOCATION   = process.env.GCP_LOCATION   || 'us-central1';
const MODEL_ID   = process.env.GEMINI_MODEL    || 'gemini-2.5-flash';

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HARASSMENT',          threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

const generativeModel = vertexAI.getGenerativeModel({
  model: MODEL_ID,
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.4,
    topP: 0.8,
    topK: 40,
  },
  safetySettings: SAFETY_SETTINGS,
});

// Separate model instance for JSON generation — forces structured JSON output
const jsonModel = vertexAI.getGenerativeModel({
  model: MODEL_ID,
  generationConfig: {
    maxOutputTokens: 4096,
    temperature: 0.2,
    topP: 0.8,
    topK: 40,
    responseMimeType: 'application/json',
  },
  safetySettings: SAFETY_SETTINGS,
});

/**
 * Send a prompt to Gemini and get a text response.
 * Includes retry with exponential backoff for 429 rate-limit errors.
 * @param {string} prompt
 * @param {number} maxRetries
 * @returns {Promise<string>}
 */
async function geminiGenerate(prompt, maxRetries = 3) {
  const request = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await generativeModel.generateContent(request);
      const response = result.response;
      return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err) {
      const is429 = err?.message?.includes('429') || err?.status === 429 || err?.code === 429;
      if (is429 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(`[Vertex AI] 429 rate-limit, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Send a prompt and parse the response as JSON.
 * Uses a dedicated JSON model with responseMimeType: 'application/json'
 * for reliable structured output. Falls back to text model + extraction.
 * @param {string} prompt
 * @returns {Promise<object>}
 */
async function geminiGenerateJSON(prompt) {
  // --- Attempt 1: Use the dedicated JSON model ---
  try {
    const request = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
    for (let attempt = 0; attempt <= 3; attempt++) {
      try {
        const result = await jsonModel.generateContent(request);
        const raw = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const parsed = JSON.parse(raw.trim());
        return parsed;
      } catch (err) {
        const is429 = err?.message?.includes('429') || err?.status === 429 || err?.code === 429;
        if (is429 && attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          console.warn(`[Vertex AI JSON] 429 rate-limit, retrying in ${Math.round(delay)}ms`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        // If it's a parse error, fall through to text model
        if (err instanceof SyntaxError) break;
        throw err;
      }
    }
  } catch (outerErr) {
    console.warn('[Vertex AI] JSON model failed, falling back to text model:', outerErr.message);
  }

  // --- Attempt 2: Fallback to text model + robust extraction ---
  const raw = await geminiGenerate(prompt);
  return extractJSON(raw);
}

/**
 * Extract JSON from a possibly messy LLM text response.
 * Handles markdown fences, leading/trailing text, thinking blocks, etc.
 */
function extractJSON(raw) {
  // 1. Strip markdown code fences
  let cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/gi, '').trim();

  // 2. Try direct parse
  try { return JSON.parse(cleaned); } catch (_) {}

  // 3. Try to find a JSON array [...] or object {...} within the text
  const arrayMatch = cleaned.match(/(\[[\s\S]*\])/);
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[1]); } catch (_) {}
  }
  const objectMatch = cleaned.match(/(\{[\s\S]*\})/);
  if (objectMatch) {
    try { return JSON.parse(objectMatch[1]); } catch (_) {}
  }

  // 4. Last resort — return raw text wrapper
  console.warn('[Vertex AI] Failed to parse JSON after all attempts, returning raw text');
  return { raw_text: cleaned };
}

module.exports = { vertexAI, generativeModel, geminiGenerate, geminiGenerateJSON, MODEL_ID };

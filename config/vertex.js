// ─── Vertex AI / Gemini Init ──────────────────────────────────────────────────
const { VertexAI } = require('@google-cloud/vertexai');

const PROJECT_ID = process.env.GCP_PROJECT_ID || 'kitahack-tehais';
const LOCATION   = process.env.GCP_LOCATION   || 'us-central1';
const MODEL_ID   = process.env.GEMINI_MODEL    || 'gemini-2.5-flash';

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

const generativeModel = vertexAI.getGenerativeModel({
  model: MODEL_ID,
  generationConfig: {
    maxOutputTokens: 2048,
    temperature: 0.4,
    topP: 0.8,
    topK: 40,
  },
  safetySettings: [
    { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_HARASSMENT',          threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  ],
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
 * @param {string} prompt
 * @returns {Promise<object>}
 */
async function geminiGenerateJSON(prompt) {
  const raw = await geminiGenerate(prompt);
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    console.warn('[Vertex AI] Failed to parse JSON, returning raw text');
    return { raw_text: cleaned };
  }
}

module.exports = { vertexAI, generativeModel, geminiGenerate, geminiGenerateJSON, MODEL_ID };

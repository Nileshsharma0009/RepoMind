import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env.js';

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || env.geminiApiKey;
  if (!apiKey || apiKey === 'dummy_gemini_api_key') {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generates vector embedding array for text using exponential backoff retry.
 * @param {string} text - The input text chunk
 * @param {number} retries - Maximum retries on 429 errors
 * @param {number} delay - Initial wait delay in ms
 * @returns {Array<number>|null} 768-dimension float array or null
 */
export const getEmbedding = async (text, retries = 4, delay = 3000) => {
  const genAI = getGenAI();
  if (!genAI) return null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent(text);
      return result.embedding?.values || null;
    } catch (err) {
      const errMsg = err.message || '';
      const isRateLimit = errMsg.includes('429') || errMsg.toLowerCase().includes('quota') || err.status === 429;

      if (isRateLimit && attempt < retries) {
        const backoffDelay = delay * Math.pow(2, attempt - 1);
        console.warn(
          `[EMBEDDING] Rate limit 429 encountered. Retrying in ${backoffDelay}ms... (Attempt ${attempt}/${retries})`
        );
        await sleep(backoffDelay);
      } else {
        console.warn('[EMBEDDING] Call failed permanently:', errMsg);
        return null;
      }
    }
  }
  return null;
};

export default {
  getEmbedding,
};

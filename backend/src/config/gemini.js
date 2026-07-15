import { GoogleGenerativeAI } from '@google/generative-ai';
import env from './env.js';

let ai = null;

if (!env.geminiApiKey || env.geminiApiKey === 'dummy_gemini_api_key') {
  console.warn('[AI] GEMINI_API_KEY is not configured or uses a dummy value. LLM completions will be unavailable or mocked.');
} else {
  try {
    ai = new GoogleGenerativeAI(env.geminiApiKey);
    console.log('[AI] Gemini AI SDK initialized successfully.');
  } catch (error) {
    console.error(`[AI] Failed to initialize Gemini AI: ${error.message}`);
  }
}

export const getGeminiClient = () => {
  return ai;
};

export default ai;

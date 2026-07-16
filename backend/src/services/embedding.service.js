import { GoogleGenAI } from '@google/genai';
import env from '../config/env.js';
import { getIndexDimension } from './pinecone.service.js';

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || env.geminiApiKey;
  if (!apiKey || apiKey === 'dummy_gemini_api_key') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let activeEmbeddingModel = null;
let cachedIndexDimension = null;

/**
 * Generates vector embedding array for text using exponential backoff retry.
 * @param {string} text - The input text chunk
 * @param {number} retries - Maximum retries on 429 errors
 * @param {number} delay - Initial wait delay in ms
 * @returns {Array<number>|null} 768-dimension float array or null
 */
export const getEmbedding = async (text, retries = 6, delay = 5000) => {
  const genAI = getGenAI();
  if (!genAI) return null;

  // Retrieve Pinecone index dimension once if Pinecone is configured
  if (cachedIndexDimension === null) {
    try {
      cachedIndexDimension = await getIndexDimension();
      if (cachedIndexDimension) {
        console.log(`[EMBEDDING] Detected Pinecone target index dimension: ${cachedIndexDimension}`);
      }
    } catch (err) {
      console.warn('[EMBEDDING] Failed to fetch Pinecone index dimension:', err.message);
    }
  }

  const models = [
    'text-embedding-004',
    'gemini-embedding-2',
    'gemini-embedding-001',
  ];

  // If we already resolved a working model in a previous call, use it directly
  const modelsToTry = activeEmbeddingModel ? [activeEmbeddingModel] : models;

  for (let attempt = 1; attempt <= retries; attempt++) {
    for (const modelName of modelsToTry) {
      try {
        const embedParams = {
          model: modelName,
          contents: text,
        };

        // Scale output dimension dynamically if Pinecone target index dimension is retrieved
        if (modelName !== 'gemini-embedding-001' && cachedIndexDimension) {
          embedParams.config = {
            outputDimensionality: cachedIndexDimension,
          };
        }

        const result = await genAI.models.embedContent(embedParams);
        const embedding = result.embedding || (result.embeddings && result.embeddings[0]);
        if (embedding?.values) {
          // Cache the successful model so we don't guess in future calls
          activeEmbeddingModel = modelName;
          return embedding.values;
        }
      } catch (err) {
        const errMsg = err.message || '';
        const isNotFound =
          errMsg.includes('404') ||
          errMsg.toLowerCase().includes('not found') ||
          errMsg.includes('ModelService.ListModels');

        if (isNotFound) {
          // Only log if we are searching (i.e. haven't stored activeEmbeddingModel yet)
          if (!activeEmbeddingModel) {
            console.warn(`[EMBEDDING] Model ${modelName} not found, trying next embedding model...`);
          }
          continue; // Try next model in the loop
        }

        const isRateLimit =
          errMsg.includes('429') ||
          errMsg.toLowerCase().includes('quota') ||
          errMsg.toLowerCase().includes('rate limit') ||
          errMsg.toLowerCase().includes('resource has been exhausted') ||
          err.status === 429;

        if (isRateLimit && attempt < retries) {
          let backoffDelay = delay * Math.pow(2, attempt - 1);

          // Try to parse exact retry seconds from the error message (e.g. "Please retry in 54s")
          const matchSeconds =
            errMsg.match(/retry(?:\s+in)?\s+(\d+)\s*s/i) ||
            errMsg.match(/retry\s+after\s+(\d+)\s*s/i) ||
            errMsg.match(/retry(?:\s+in)?\s+(\d+)\s*seconds/i);

          if (matchSeconds && matchSeconds[1]) {
            const parsedSeconds = parseInt(matchSeconds[1], 10);
            backoffDelay = (parsedSeconds + 2) * 1000; // wait parsed seconds + 2 seconds safety buffer
            console.log(`[EMBEDDING] Parsed rate limit wait time of ${parsedSeconds}s from error. Adjusting backoff sleep to ${backoffDelay}ms.`);
          }

          console.warn(
            `[EMBEDDING] Rate limit 429 encountered. Retrying in ${backoffDelay}ms... (Attempt ${attempt}/${retries})`
          );
          await sleep(backoffDelay);
          break; // Break models loop to retry the current attempt
        } else {
          console.warn(`[EMBEDDING] Embedding attempt ${attempt} failed for ${modelName}:`, errMsg);
        }
      }
    }
  }
  return null;
};

export default {
  getEmbedding,
};

import { Pinecone } from '@pinecone-database/pinecone';
import env from './env.js';

let pinecone = null;

if (!env.pineconeApiKey || env.pineconeApiKey === 'dummy_pinecone_api_key') {
  console.warn('[PINECONE] PINECONE_API_KEY is not configured or uses a dummy value. Vector search features will be unavailable or mocked.');
} else {
  try {
    pinecone = new Pinecone({
      apiKey: env.pineconeApiKey
    });
    console.log('[PINECONE] Pinecone client initialized successfully.');
  } catch (error) {
    console.error(`[PINECONE] Failed to initialize Pinecone: ${error.message}`);
  }
}

export const getPineconeClient = () => {
  return pinecone;
};

export default pinecone;

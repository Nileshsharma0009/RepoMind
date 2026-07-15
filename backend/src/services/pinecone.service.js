import { Pinecone } from '@pinecone-database/pinecone';
import env from '../config/env.js';

const getPineconeIndex = () => {
  const apiKey = process.env.PINECONE_API_KEY || env.pineconeApiKey;
  const indexName = process.env.PINECONE_INDEX || env.pineconeIndex;

  if (!apiKey || apiKey === 'dummy_pinecone_api_key' || !indexName) {
    return null;
  }

  try {
    const pc = new Pinecone({ apiKey });
    return pc.index(indexName);
  } catch (err) {
    console.warn('[PINECONE SERVICE] Failed to connect:', err.message);
    return null;
  }
};

/**
 * Upserts a list of vectors to Pinecone
 * @param {Array} vectors - Array of { id, values, metadata }
 */
export const upsertVectors = async (vectors) => {
  try {
    const index = getPineconeIndex();
    if (!index) return false;

    // Pinecone allows batch upserting
    await index.upsert(vectors);
    return true;
  } catch (err) {
    console.warn('[PINECONE SERVICE] Failed to upsert vectors:', err.message);
    return false;
  }
};

/**
 * Queries Pinecone index for matches
 * @param {Array<number>} vector - Float vector embedding
 * @param {string} repositoryId - Filter queries by repositoryId metadata
 * @param {number} limit - Maximum matches to fetch
 */
export const queryVectors = async (vector, repositoryId, limit = 5) => {
  try {
    const index = getPineconeIndex();
    if (!index) return null;

    const queryResponse = await index.query({
      vector,
      topK: limit,
      filter: { repositoryId: { $eq: repositoryId } },
      includeMetadata: true,
    });

    return queryResponse.matches || [];
  } catch (err) {
    console.warn('[PINECONE SERVICE] Failed to query vector index:', err.message);
    return null;
  }
};

/**
 * Deletes all vector embeddings associated with a repository
 * @param {string} repositoryId - The repository ID
 */
export const deleteRepositoryVectors = async (repositoryId) => {
  try {
    const index = getPineconeIndex();
    if (!index) return false;

    // Delete by metadata filter
    await index.deleteMany({ repositoryId });
    return true;
  } catch (err) {
    console.warn('[PINECONE SERVICE] Failed to delete repository vectors:', err.message);
    return false;
  }
};

export default {
  upsertVectors,
  queryVectors,
  deleteRepositoryVectors,
};

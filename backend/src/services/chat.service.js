import { GoogleGenAI } from '@google/genai';
import env from '../config/env.js';
import limiter from '../utils/limiter.js';
import RepositoryIndex from '../models/RepositoryIndex.js';
import Repository from '../models/Repository.js';
import { getEmbedding } from './embedding.service.js';
import { queryVectors } from './pinecone.service.js';
import path from 'path';

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || env.geminiApiKey;
  if (!apiKey || apiKey === 'dummy_gemini_api_key') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Searches local MongoDB chunks using keyword regex match.
 */
const searchLocalChunks = async (repositoryId, queryText, limit = 8) => {
  // Extract keywords (words with length > 2)
  const keywords = queryText
    .replace(/[^\w\s-]/g, '') // remove punctuation
    .split(/\s+/)
    .filter((word) => word.length > 2);

  if (keywords.length === 0) {
    // If no good keywords, return top files
    return await RepositoryIndex.find({ repositoryId }).limit(limit);
  }

  // Create regex patterns for keywords (case-insensitive)
  const orConditions = keywords.map((k) => ({
    content: { $regex: k, $options: 'i' },
  }));

  // Also match filePath
  keywords.forEach((k) => {
    orConditions.push({
      filePath: { $regex: k, $options: 'i' },
    });
  });

  const matches = await RepositoryIndex.find({
    repositoryId,
    $or: orConditions,
  }).limit(limit);

  if (matches.length === 0) {
    // Fallback: If keyword match returns nothing, fetch the first few indexed files/chunks (e.g. README.md or entry points)
    // to give the model some context of the repository structure
    return await RepositoryIndex.find({ repositoryId })
      .sort({ filePath: 1, chunkIndex: 1 })
      .limit(limit);
  }

  return matches;
};

/**
 * Generates an answer from Gemini using context snippets retrieved from vector or local search.
 * @param {string} repositoryId - Repository Database ID
 * @param {string} message - User question
 * @param {Array} chatHistory - Previous messages [{ role: 'user'|'model', content: string }]
 */
export const generateChatAnswer = async (repositoryId, message, chatHistory = []) => {
  console.log(`[AI-CHAT] Processing query for Repo ${repositoryId}: "${message}"`);

  let matchedChunks = [];
  const references = [];
  let repo;

  try {
    repo = await Repository.findById(repositoryId);
    if (!repo) {
      throw new Error('Repository not found.');
    }

    let matchedChunks = [];

    // Try vector-based RAG first
    const embedding = await getEmbedding(message);
    if (embedding && embedding.length > 0) {
      console.log('[AI-CHAT] Performing vector search query in Pinecone...');
      const matches = await queryVectors(embedding, String(repositoryId), 6);
      if (matches && matches.length > 0) {
        matchedChunks = matches.map((m) => ({
          filePath: m.metadata.filePath,
          startLine: m.metadata.startLine,
          endLine: m.metadata.endLine,
          content: m.metadata.content,
        }));
      }
    }

    // Fall back to keyword match in MongoDB if Pinecone is inactive or returns nothing
    if (matchedChunks.length === 0) {
      console.log('[AI-CHAT] Falling back to MongoDB keyword-regex indexing search...');
      const localMatches = await searchLocalChunks(repositoryId, message, 6);
      matchedChunks = localMatches.map((m) => ({
        filePath: m.filePath,
        startLine: m.startLine,
        endLine: m.endLine,
        content: m.content,
      }));
    }

    console.log(`[AI-CHAT] Retrieved ${matchedChunks.length} matching code blocks.`);

    // 1. Build prompt context
    let contextStr = '';

    matchedChunks.forEach((chunk, idx) => {
      contextStr += `\n---\nSnippet #${idx + 1}\nFile: ${chunk.filePath} (Lines ${chunk.startLine}-${chunk.endLine})\n${chunk.content}\n---\n`;
      
      // Save cited references
      references.push({
        filePath: chunk.filePath,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
      });
    });

    // 2. Check if Gemini Key is available
    const genAI = getGenAI();
    if (!genAI) {
      // Mock/Instruction responses for setup
      const localMatchesList = references
        .map((r) => `- [${path.basename(r.filePath)}: L${r.startLine}-${r.endLine}](repomind:///${r.filePath}#L${r.startLine})`)
        .join('\n');

      return {
        answer: `### ⚠️ Gemini API Key Not Found
It looks like **\`GEMINI_API_KEY\`** is not configured or uses a dummy value in your \`backend/.env\` file. 

However, my local keyword search matched **${matchedChunks.length} relevant code blocks** in this codebase:

${localMatchesList}

To unlock full AI chatbot explanations, please add a valid \`GEMINI_API_KEY\` to your backend environment file and restart.`,
        references,
      };
    }

    // 3. Build system instruction
    const systemInstruction = `You are RepoMind, an expert AI coordinator and developer. 
Analyze the provided code snippets from the active repository to answer the user's questions.

Context Code Snippets:
${contextStr}

Constraints:
- Answer the user's questions accurately using the context.
- ALWAYS cite files and lines in your answer using markdown links following the format \`[filename:Lline](repomind:///filepath#Lline)\`. E.g., \`[app.js:L20](repomind:///backend/src/app.js#L20)\`.
- If the question is not about the repository or the files do not contain the answer, say "I cannot find details in the connected files" and suggest checking other files.`;

    // Map history to Gemini format
    const contents = chatHistory.map((h) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    }));

    // Add current question
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const geminiModels = [
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
    ];

    let result;
    for (const modelName of geminiModels) {
      try {
        result = await limiter.schedule(() =>
          genAI.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction,
            },
          })
        );
        break;
      } catch (err) {
        console.warn(`[AI-CHAT] Model ${modelName} failed:`, err.message);

        // Stop fallback loop immediately on 429 rate limit
        const errMsg = err.message || '';
        const isRateLimit =
          errMsg.includes('429') ||
          errMsg.toLowerCase().includes('quota') ||
          errMsg.toLowerCase().includes('rate limit') ||
          errMsg.toLowerCase().includes('resource_exhausted') ||
          err.status === 429;

        if (isRateLimit) {
          throw err;
        }
      }
    }

    if (!result) {
      throw new Error('No Gemini model available.');
    }

    const responseText = typeof result.text === 'function' ? result.text() : result.text;

    return {
      answer: responseText,
      references,
    };
  } catch (err) {
    console.error('[AI-CHAT] Chat generation failed:', err.message);
    throw err;
  }
};

export default {
  generateChatAnswer,
};

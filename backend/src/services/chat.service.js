import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env.js';
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
  return new GoogleGenerativeAI(apiKey);
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

  return await RepositoryIndex.find({
    repositoryId,
    $or: orConditions,
  }).limit(limit);
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

    console.log('[AI-CHAT] Querying codebase segments directly via local MongoDB search...');
    const localMatches = await searchLocalChunks(repositoryId, message, 6);
    matchedChunks = localMatches.map((m) => ({
      filePath: m.filePath,
      startLine: m.startLine,
      endLine: m.endLine,
      content: m.content,
    }));

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

    let result;
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction,
      });
      result = await model.generateContent({ contents });
    } catch (err) {
      const errMsg = err.message || '';
      if (errMsg.includes('404') || errMsg.toLowerCase().includes('not found')) {
        console.warn('[AI-CHAT] gemini-1.5-flash failed with 404, attempting gemini-1.5-flash-latest...');
        try {
          const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash-latest',
            systemInstruction,
          });
          result = await model.generateContent({ contents });
        } catch (err2) {
          console.warn('[AI-CHAT] gemini-1.5-flash-latest failed, falling back to stable gemini-pro...');
          // For gemini-pro, system instruction can be concatenated directly into prompt parts
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
          const modifiedContents = [
            {
              role: 'user',
              parts: [{ text: `System Instructions:\n${systemInstruction}\n\nBegin chat history.` }],
            },
            ...contents,
          ];
          result = await model.generateContent({ contents: modifiedContents });
        }
      } else {
        throw err;
      }
    }

    const responseText = result.response.text();

    return {
      answer: responseText,
      references,
    };
  } catch (err) {
    console.error('[AI-CHAT] Chat generation failed:', err.message);
    const localMatchesList = references
      .map((r) => `- [${r.filePath.split('/').pop()}: L${r.startLine}-${r.endLine}](repomind:///${r.filePath}#L${r.startLine})`)
      .join('\n');

    return {
      answer: `### ⚠️ Gemini API Resolution Failure
The chat engine encountered an error generating an AI response: **${err.message}**

**Diagnostics Guide**:
1. Confirm that your \`GEMINI_API_KEY\` is loaded and valid in your \`.env\` file.
2. Verify that the **Generative Language API** is enabled in your Google AI Studio or Google Cloud Console.

**Offline Local Code Matches (${references.length})**:
Despite the API offline status, here are code sections from this codebase related to your question:
${localMatchesList || '_No keyword occurrences matched in local files._'}`,
      references,
    };
  }
};

export default {
  generateChatAnswer,
};

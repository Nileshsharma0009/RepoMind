import RepositoryIndex from '../models/RepositoryIndex.js';
import Repository from '../models/Repository.js';
import User from '../models/User.js';
import { fetchFileContent } from './github.service.js';

/**
 * Splits a file content string into overlapping code line chunks.
 */
const segmentFileByLines = (content, chunkSize = 40, overlap = 10) => {
  const lines = content.split('\n');
  const chunks = [];

  if (lines.length <= chunkSize) {
    return [
      {
        content,
        startLine: 1,
        endLine: lines.length,
      },
    ];
  }

  let start = 0;
  while (start < lines.length) {
    const chunkLines = lines.slice(start, start + chunkSize);
    const chunkText = chunkLines.join('\n');

    chunks.push({
      content: chunkText,
      startLine: start + 1,
      endLine: Math.min(start + chunkSize, lines.length),
    });

    start += chunkSize - overlap;
  }

  return chunks;
};

/**
 * Indexes all files of a repository into chunks directly inside MongoDB.
 */
export const indexRepositoryChunks = async (repositoryId, userId) => {
  console.log(`[LOCAL-INDEXER] Starting code indexing for Repo: ${repositoryId}`);

  try {
    const repo = await Repository.findById(repositoryId);
    if (!repo) {
      throw new Error(`Repository not found: ${repositoryId}`);
    }

    const user = await User.findById(userId).select('+githubAccessToken');
    if (!user || !user.githubAccessToken) {
      throw new Error('User not found or GitHub access token missing.');
    }

    const accessToken = user.githubAccessToken;

    // Clear old chunk index records in MongoDB
    await RepositoryIndex.deleteMany({ repositoryId });

    const files = repo.parsedData?.files || [];
    if (files.length === 0) {
      console.log('[LOCAL-INDEXER] No files to chunk.');
      return;
    }

    let totalChunkCount = 0;

    // Process files locally
    for (const file of files) {
      const textExtensions = [
        '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.md',
        '.html', '.css', '.json', '.yml', '.yaml', '.txt',
        '.routes', '.controller', '.service', '.model',
      ];

      if (!textExtensions.includes(file.extension) && file.type === 'other') {
        continue; // Skip non-code binaries
      }

      if (!file.sha) {
        continue;
      }

      try {
        const content = await fetchFileContent(repo.owner, repo.name, file.sha, accessToken);
        const chunks = segmentFileByLines(content);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];

          // Save chunk to MongoDB RepositoryIndex
          await RepositoryIndex.create({
            repositoryId: repo._id,
            filePath: file.path,
            chunkIndex: i,
            content: chunk.content,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
          });

          totalChunkCount++;
        }
      } catch (fileErr) {
        console.warn(`[LOCAL-INDEXER] Skipping file ${file.path} due to processing error:`, fileErr.message);
      }
    }

    // Update status to indexed
    await Repository.findByIdAndUpdate(repositoryId, { status: 'indexed' });
    console.log(`[LOCAL-INDEXER] Local indexing completed. Total chunks: ${totalChunkCount}`);
  } catch (err) {
    console.error('[LOCAL-INDEXER] Background indexing failed:', err.message);
    await Repository.findByIdAndUpdate(repositoryId, { status: 'failed', errorMessage: err.message });
  }
};

export default {
  indexRepositoryChunks,
};

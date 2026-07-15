import Repository from '../models/Repository.js';
import RepositoryIndex from '../models/RepositoryIndex.js';
import User from '../models/User.js';
import axios from 'axios';
import githubConfig from '../config/github.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchFileContent } from '../services/github.service.js';
import env from '../config/env.js';

const githubApi = axios.create({
  baseURL: githubConfig.apiUrl,
  headers: {
    Accept: 'application/vnd.github+json',
  },
});

/**
 * Fetch commits and issues/PRs directly from GitHub.
 */
export const getGitInfo = async (req, res, next) => {
  try {
    const repository = await Repository.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!repository) {
      return res.status(404).json({
        status: 'error',
        message: 'Repository not found or access denied.',
      });
    }

    const user = await User.findById(req.user._id).select('+githubAccessToken');
    if (!user || !user.githubAccessToken) {
      return res.status(400).json({
        status: 'error',
        message: 'GitHub credentials missing or expired.',
      });
    }

    const token = user.githubAccessToken;

    // Fetch commits
    let commits = [];
    try {
      const { data: commitsData } = await githubApi.get(
        `/repos/${repository.owner}/${repository.name}/commits?per_page=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      commits = commitsData.map((c) => ({
        sha: c.sha.substring(0, 7),
        author: c.commit.author.name,
        avatar: c.author?.avatar_url || '',
        message: c.commit.message,
        date: c.commit.author.date,
        url: c.html_url,
      }));
    } catch (err) {
      console.warn('[PM CONTROLLER] Failed to fetch commits:', err.message);
    }

    // Fetch issues & PRs
    let issues = [];
    try {
      const { data: issuesData } = await githubApi.get(
        `/repos/${repository.owner}/${repository.name}/issues?state=all&per_page=15`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      issues = issuesData.map((i) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        isPullRequest: !!i.pull_request,
        url: i.html_url,
        createdAt: i.created_at,
        user: i.user?.login || 'unknown',
      }));
    } catch (err) {
      console.warn('[PM CONTROLLER] Failed to fetch issues:', err.message);
    }

    res.status(200).json({
      status: 'success',
      commits,
      issues,
    });
  } catch (error) {
    console.error('[PM CONTROLLER] Error fetching git info:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve Git details from GitHub.',
    });
  }
};

/**
 * Harvests all TODO or FIXME comments inside repository file chunks.
 */
export const harvestTodos = async (req, res, next) => {
  try {
    const repository = await Repository.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!repository) {
      return res.status(404).json({
        status: 'error',
        message: 'Repository not found or access denied.',
      });
    }

    // Find chunks containing TODO or FIXME (case insensitive)
    const chunks = await RepositoryIndex.find({
      repositoryId: repository._id,
      content: { $regex: /\b(TODO|FIXME)\b/i },
    });

    const todos = [];

    chunks.forEach((chunk) => {
      const lines = chunk.content.split('\n');
      lines.forEach((line, idx) => {
        const todoMatch = line.match(/\b(TODO|FIXME)\b[:\s]*(.*)/i);
        if (todoMatch) {
          const type = todoMatch[1].toUpperCase();
          const taskDescription = todoMatch[2].trim() || 'Action item found in comments';
          const lineNumber = chunk.startLine + idx;
          
          todos.push({
            filePath: chunk.filePath,
            fileName: chunk.filePath.split('/').pop(),
            line: lineNumber,
            text: taskDescription,
            type,
            priority: type === 'FIXME' ? 'High' : 'Medium',
          });
        }
      });
    });

    res.status(200).json({
      status: 'success',
      results: todos.length,
      todos,
    });
  } catch (error) {
    console.error('[PM CONTROLLER] Error harvesting TODOs:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to query codebase TODOs.',
    });
  }
};

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || env.geminiApiKey;
  if (!apiKey || apiKey === 'dummy_gemini_api_key') {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

export const runAgentAnalysis = async (req, res, next) => {
  try {
    const { repositoryId, filePath, agentType } = req.body;

    if (!repositoryId || !filePath || !agentType) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing repositoryId, filePath, or agentType parameter.',
      });
    }

    const repository = await Repository.findOne({ _id: repositoryId, userId: req.user._id });
    if (!repository) {
      return res.status(404).json({
        status: 'error',
        message: 'Repository not found or access denied.',
      });
    }

    const file = repository.parsedData?.files?.find((f) => f.path === filePath);
    if (!file || !file.sha) {
      return res.status(404).json({
        status: 'error',
        message: `File content not indexed: ${filePath}`,
      });
    }

    const user = await User.findById(req.user._id).select('+githubAccessToken');
    const content = await fetchFileContent(repository.owner, repository.name, file.sha, user.githubAccessToken);

    let prompt = '';
    switch (agentType) {
      case 'reviewer':
        prompt = `Act as a senior software reviewer. Inspect the following file content and write a detailed codebase review highlighting bugs, style guidelines issues, and structural design pattern suggestions:\n\nFile: ${filePath}\n\nCode Content:\n\`\`\`\n${content}\n\`\`\``;
        break;
      case 'tester':
        prompt = `Act as an automated QA engineer. Write robust unit tests covering edge cases and main pathways for this code block:\n\nFile: ${filePath}\n\nCode Content:\n\`\`\`\n${content}\n\`\`\``;
        break;
      case 'security':
        prompt = `Act as an application security analyst. Audit the following file content for security issues like credential exposure, cross-site scriptings, database injections, scope pollution, or weak cryptographic logic:\n\nFile: ${filePath}\n\nCode Content:\n\`\`\`\n${content}\n\`\`\``;
        break;
      case 'refactor':
        prompt = `Act as a software optimization expert. Refactor the following module to make it cleaner, more readable, and performant. Keep original exports and functionalities, but replace redundant blocks with clean syntax, explaining your modifications:\n\nFile: ${filePath}\n\nCode Content:\n\`\`\`\n${content}\n\`\`\``;
        break;
      case 'bug':
        prompt = `Act as an expert debugger. Analyze this file content to trace possible runtime exceptions, unhandled promises, reference errors, memory leaks, or type mismatch bugs. Suggest exact fixes:\n\nFile: ${filePath}\n\nCode Content:\n\`\`\`\n${content}\n\`\`\``;
        break;
      default:
        prompt = `Analyze the file ${filePath} for software quality improvements.`;
    }

    const genAI = getGenAI();
    if (!genAI) {
      return res.status(200).json({
        status: 'success',
        result: `### ⚠️ Gemini API Key Required
Please configure a valid \`GEMINI_API_KEY\` in your \`backend/.env\` to run this agent.

**Fallback Local Report**:
- **Target File**: \`${filePath}\`
- **Agent Type**: \`${agentType.toUpperCase()}\`
- **File size**: ${file.size} bytes

Ready to run analysis as soon as keys are configured.`,
      });
    }

    let result;
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      result = await model.generateContent(prompt);
    } catch (err) {
      const errMsg = err.message || '';
      if (errMsg.includes('404') || errMsg.toLowerCase().includes('not found')) {
        console.warn('[PM AGENT] gemini-1.5-flash failed, trying gemini-1.5-flash-latest...');
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
          result = await model.generateContent(prompt);
        } catch (err2) {
          console.warn('[PM AGENT] gemini-1.5-flash-latest failed, trying gemini-pro...');
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
          result = await model.generateContent(prompt);
        }
      } else {
        throw err;
      }
    }
    const responseText = result.response.text();

    res.status(200).json({
      status: 'success',
      result: responseText,
    });
  } catch (error) {
    console.error('[PM CONTROLLER] Agent run failed:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'AI Agent failed to execute. ' + error.message,
    });
  }
};

export default {
  getGitInfo,
  harvestTodos,
  runAgentAnalysis,
};

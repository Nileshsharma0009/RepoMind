import Repository from '../models/Repository.js';
import RepositoryIndex from '../models/RepositoryIndex.js';
import User from '../models/User.js';
import axios from 'axios';
import githubConfig from '../config/github.js';
import { GoogleGenAI } from '@google/genai';
import { fetchFileContent } from '../services/github.service.js';
import env from '../config/env.js';
import limiter from '../utils/limiter.js';

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

      const rawIssues = issuesData.map((i) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        isPullRequest: !!i.pull_request,
        url: i.html_url,
        createdAt: i.created_at,
        user: i.user?.login || 'unknown',
      }));

      // Dynamically prioritize using Gemini AI
      let priorityMap = {};
      const genAI = getGenAI();
      if (genAI && rawIssues.length > 0) {
        try {
          const pmPrompt = `Act as an expert project manager. You are given a list of GitHub issues and pull requests from a repository backlog.
Analyze their titles to assign:
1. A Priority level: 'P0' (Critical blockage, security leak, critical bug), 'P1' (Major functionality, setup guide, high priority bug), 'P2' (Medium features, enhancements), or 'P3' (Minor task, typos).
2. A single sentence Rationale for the assigned priority.

Here is the JSON list of items to prioritize:
${JSON.stringify(rawIssues.map(i => ({ number: i.number, title: i.title, isPullRequest: i.isPullRequest })), null, 2)}

Provide your output ONLY as a valid JSON array of objects conforming exactly to this structure (no markdown fences, no explainers):
[
  {
    "number": <number>,
    "priority": "P0" | "P1" | "P2" | "P3",
    "rationale": "<sentence>"
  }
]
`;
          const geminiResult = await limiter.schedule(() =>
            genAI.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: pmPrompt,
            })
          );
          const responseText = typeof geminiResult.text === 'function' ? geminiResult.text() : geminiResult.text;
          const cleanText = responseText.replace(/```json/i, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanText);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => {
              priorityMap[item.number] = {
                priority: item.priority || 'P2',
                rationale: item.rationale || 'Assigned default priority.',
              };
            });
          }
        } catch (err) {
          console.warn('[PM CONTROLLER] Failed to prioritize issues using AI:', err.message);
        }
      }

      issues = rawIssues.map((i) => {
        const prioInfo = priorityMap[i.number] || {
          priority: i.isPullRequest ? 'P1' : 'P2',
          rationale: i.isPullRequest ? 'Review pull request code changes.' : 'Open issue backlogged.',
        };
        return {
          ...i,
          priority: prioInfo.priority,
          rationale: prioInfo.rationale,
        };
      });

      // Sort by priority (P0 -> P1 -> P2 -> P3)
      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
      issues.sort((a, b) => {
        const orderA = priorityOrder[a.priority] ?? 2;
        const orderB = priorityOrder[b.priority] ?? 2;
        if (orderA !== orderB) return orderA - orderB;
        if (a.state !== b.state) return a.state === 'open' ? -1 : 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

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
      content: { $regex: '\\b(TODO|FIXME)\\b', $options: 'i' },
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
  return new GoogleGenAI({ apiKey });
};

export const runAgentAnalysis = async (req, res, next) => {
  try {
    const { repositoryId, filePath, agentType } = req.body;

    if (!repositoryId || !agentType) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing repositoryId or agentType parameter.',
      });
    }

    const repository = await Repository.findOne({ _id: repositoryId, userId: req.user._id });
    if (!repository) {
      return res.status(404).json({
        status: 'error',
        message: 'Repository not found or access denied.',
      });
    }

    // Build system-wide context layout
    const filesList = repository.parsedData?.files || [];
    const routes = filesList.filter(f => f.type === 'route').map(f => f.path);
    const controllers = filesList.filter(f => f.type === 'controller').map(f => f.path);
    const services = filesList.filter(f => f.type === 'service').map(f => f.path);
    const models = filesList.filter(f => f.type === 'model').map(f => f.path);

    const systemLayout = `System Context Layout:
- Repository: ${repository.fullName}
- Description: ${repository.description || 'No description.'}
- Default Branch: ${repository.defaultBranch}
- Route endpoints: ${routes.slice(0, 8).join(', ')} ${routes.length > 8 ? `(+${routes.length - 8} more)` : ''}
- Controllers: ${controllers.slice(0, 8).join(', ')} ${controllers.length > 8 ? `(+${controllers.length - 8} more)` : ''}
- Services: ${services.slice(0, 8).join(', ')} ${services.length > 8 ? `(+${services.length - 8} more)` : ''}
- Database Models: ${models.slice(0, 8).join(', ')} ${models.length > 8 ? `(+${models.length - 8} more)` : ''}`;

    let prompt = '';

    if (filePath) {
      // 1. File-level audit (with system-wide layout context)
      const file = repository.parsedData?.files?.find((f) => f.path === filePath);
      if (!file || !file.sha) {
        return res.status(404).json({
          status: 'error',
          message: `File content not indexed: ${filePath}`,
        });
      }

      const user = await User.findById(req.user._id).select('+githubAccessToken');
      const content = await fetchFileContent(repository.owner, repository.name, file.sha, user.githubAccessToken);

      switch (agentType) {
        case 'reviewer':
          prompt = `Act as a senior software reviewer. Audit this file with the system layout context in mind. Detail bugs, coding practices, and design pattern improvements relative to other modules:\n\n${systemLayout}\n\nTarget File: ${filePath}\n\nContent:\n\`\`\`\n${content}\n\`\`\``;
          break;
        case 'tester':
          prompt = `Act as a QA engineer. Generate Jest unit tests for this file, keeping exports and relationships defined in layout context in mind:\n\n${systemLayout}\n\nTarget File: ${filePath}\n\nContent:\n\`\`\`\n${content}\n\`\`\``;
          break;
        case 'security':
          prompt = `Act as a security auditor. Inspect this file for vulnerabilities like injections, hardcoded keys, scope pollution, or missing auth tokens, in the context of the wider system:\n\n${systemLayout}\n\nTarget File: ${filePath}\n\nContent:\n\`\`\`\n${content}\n\`\`\``;
          break;
        case 'refactor':
          prompt = `Act as an optimization expert. Refactor this file for better performance and modularity, explaining modifications relative to system layout dependencies:\n\n${systemLayout}\n\nTarget File: ${filePath}\n\nContent:\n\`\`\`\n${content}\n\`\`\``;
          break;
        case 'bug':
          prompt = `Act as an expert debugger. Locate runtime errors, type mismatch triggers, unhandled database promises, or leaks in this file:\n\n${systemLayout}\n\nTarget File: ${filePath}\n\nContent:\n\`\`\`\n${content}\n\`\`\``;
          break;
        default:
          prompt = `Analyze this file in the context of the system:\n\n${systemLayout}\n\nTarget File: ${filePath}\n\nContent:\n\`\`\`\n${content}\n\`\`\``;
      }
    } else {
      // 2. Global Repository-level audit (no file selected)
      switch (agentType) {
        case 'reviewer':
          prompt = `Act as a principal codebase architect. Audit the entire project structure and directory splits, providing suggestions for architectural improvements:\n\n${systemLayout}`;
          break;
        case 'tester':
          prompt = `Act as a QA planner. Generate a comprehensive unit testing coverage matrix strategy plan listing which routes, controllers, and models need Jest unit tests first:\n\n${systemLayout}`;
          break;
        case 'security':
          prompt = `Act as a chief security officer. Audit the codebase directory layout for global architectural vulnerabilities, insecure setups, or lack of authorization controllers:\n\n${systemLayout}`;
          break;
        case 'refactor':
          prompt = `Act as a clean code advocate. Recommend refactoring guidelines, directory splits, and modular abstractions for this project layout:\n\n${systemLayout}`;
          break;
        case 'bug':
          prompt = `Act as a debug investigator. Analyze the directory mapping for missing configurations, logic leak vectors, or setup risks:\n\n${systemLayout}`;
          break;
        default:
          prompt = `Provide a global repository architecture report:\n\n${systemLayout}`;
      }
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

    const geminiModels = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
    ];

    let result;
    for (const modelName of geminiModels) {
      try {
        result = await limiter.schedule(() =>
          genAI.models.generateContent({
            model: modelName,
            contents: prompt,
          })
        );
        break;
      } catch (err) {
        console.warn(`[PM AGENT] Model ${modelName} failed:`, err.message);

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

    res.status(200).json({
      status: 'success',
      result: responseText,
    });
  } catch (error) {
    console.error('[PM CONTROLLER] Agent run failed:', error.message);
    
    const errMsg = error.message || '';
    const isRateLimit =
      errMsg.includes('429') ||
      errMsg.toLowerCase().includes('quota') ||
      errMsg.toLowerCase().includes('rate limit') ||
      errMsg.toLowerCase().includes('resource_exhausted') ||
      error.status === 429;

    let resultMessage = `### ⚠️ AI Agent Execution Failed
The agent encountered a configuration or API error: **${error.message}**

**Troubleshooting Checklist**:
1. Check that the \`GEMINI_API_KEY\` in your backend \`.env\` file is correct.
2. Confirm the **Generative Language API** is enabled for this API key in Google Cloud Console / Google AI Studio.
3. If this is a free key, make sure you are not exceeding rate limits (15 RPM).`;

    if (isRateLimit) {
      const matchSeconds =
        errMsg.match(/retry(?:\s+in)?\s+([\d\.]+)\s*s/i) ||
        errMsg.match(/retry\s+after\s+(\d+)\s*s/i) ||
        errMsg.match(/retry(?:\s+in)?\s+(\d+)\s*seconds/i);
      const seconds = matchSeconds ? Math.ceil(parseFloat(matchSeconds[1])) : 60;
      resultMessage = `### ⚠️ Gemini API Rate Limit Reached
You have exceeded the Gemini free-tier rate limits. Please wait **${seconds} seconds** and try running the agent again.`;
    }

    res.status(200).json({
      status: 'success',
      result: resultMessage,
    });
  }
};

export default {
  getGitInfo,
  harvestTodos,
  runAgentAnalysis,
};

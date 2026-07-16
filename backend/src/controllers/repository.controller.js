import Repository from '../models/Repository.js';
import RepositoryIndex from '../models/RepositoryIndex.js';
import User from '../models/User.js';
import Commit from '../models/Commit.js';
import { fetchFileContent, commitFileToRepo } from '../services/github.service.js';
import { connectRepository, indexRepositoryBackground } from '../services/repository.service.js';

export const listConnectedRepos = async (req, res, next) => {
  try {
    const repos = await Repository.find({ userId: req.user._id })
      .select('-fileTree -parsedData.files') // Exclude heavy fields for the list view
      .sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: repos.length,
      repositories: repos,
    });
  } catch (error) {
    console.error('[REPOSITORY CONTROLLER] Error listing repos:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve connected repositories.',
    });
  }
};

export const connectRepo = async (req, res, next) => {
  try {
    const { githubId, name, fullName, description, owner, url, defaultBranch } = req.body;

    if (!githubId || !name || !fullName || !owner) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required repository details (githubId, name, fullName, owner).',
      });
    }

    const repository = await connectRepository(
      { githubId, name, fullName, description, owner, url, defaultBranch },
      req.user._id
    );

    res.status(201).json({
      status: 'success',
      message: 'Repository connected successfully. Indexing has started in the background.',
      repository,
    });
  } catch (error) {
    console.error('[REPOSITORY CONTROLLER] Error connecting repo:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect repository. ' + error.message,
    });
  }
};

export const getRepoDetails = async (req, res, next) => {
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

    res.status(200).json({
      status: 'success',
      repository,
    });
  } catch (error) {
    console.error('[REPOSITORY CONTROLLER] Error getting repo details:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve repository details.',
    });
  }
};

export const syncRepo = async (req, res, next) => {
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

    repository.status = 'indexing';
    repository.errorMessage = '';
    await repository.save();

    // Trigger parsing asynchronously
    setTimeout(() => {
      indexRepositoryBackground(repository._id, req.user._id);
    }, 100);

    res.status(200).json({
      status: 'success',
      message: 'Repository synchronization started in the background.',
      repository,
    });
  } catch (error) {
    console.error('[REPOSITORY CONTROLLER] Error syncing repo:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to sync repository.',
    });
  }
};

export const disconnectRepo = async (req, res, next) => {
  try {
    const repository = await Repository.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!repository) {
      return res.status(404).json({
        status: 'error',
        message: 'Repository not found or access denied.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Repository disconnected and deleted successfully.',
    });
  } catch (error) {
    console.error('[REPOSITORY CONTROLLER] Error disconnecting repo:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to disconnect repository.',
    });
  }
};

export const getFileContent = async (req, res, next) => {
  try {
    const { path: filePath } = req.query;
    if (!filePath) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing path query parameter.',
      });
    }

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

    const file = repository.parsedData?.files?.find((f) => f.path === filePath);
    if (!file || !file.sha) {
      return res.status(404).json({
        status: 'error',
        message: `File not indexed or missing content hash: ${filePath}`,
      });
    }

    const user = await User.findById(req.user._id).select('+githubAccessToken');
    if (!user || !user.githubAccessToken) {
      return res.status(400).json({
        status: 'error',
        message: 'GitHub credentials missing or expired.',
      });
    }

    const content = await fetchFileContent(
      repository.owner,
      repository.name,
      file.sha,
      user.githubAccessToken
    );

    res.status(200).json({
      status: 'success',
      content,
    });
  } catch (error) {
    console.error('[REPOSITORY CONTROLLER] Error loading file content:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to load file content from GitHub API.',
    });
  }
};

export const searchRepositoryIndex = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Missing search query parameter.',
      });
    }

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

    const matches = await RepositoryIndex.find({
      repositoryId: repository._id,
      content: { $regex: query, $options: 'i' },
    }).limit(25);

    const results = matches.map((m) => {
      const lines = m.content.split('\n');
      const matchLines = [];

      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          matchLines.push({
            lineNumber: m.startLine + idx,
            content: line.trim(),
          });
        }
      });

      return {
        filePath: m.filePath,
        fileName: m.filePath.split('/').pop(),
        startLine: m.startLine,
        endLine: m.endLine,
        snippet: m.content,
        matches: matchLines,
      };
    });

    res.status(200).json({
      status: 'success',
      results: results.length,
      matches: results,
    });
  } catch (error) {
    console.error('[REPOSITORY CONTROLLER] Code search operation failed:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to complete code search.',
    });
  }
};

export const commitDocFile = async (req, res, next) => {
  try {
    const { id: repositoryId } = req.params;
    const { filePath, content, commitMessage } = req.body;

    if (!filePath || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing filePath or content in request body.',
      });
    }

    const repository = await Repository.findOne({
      _id: repositoryId,
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
      return res.status(401).json({
        status: 'error',
        message: 'User does not have an active GitHub token. Please re-authenticate.',
      });
    }

    const msg = commitMessage || `docs: update ${filePath} via RepoMind`;
    const result = await commitFileToRepo(
      repository.owner,
      repository.name,
      filePath,
      content,
      msg,
      repository.defaultBranch || 'main',
      user.githubAccessToken
    );

    // Save commit record to database
    try {
      await Commit.create({
        userId: req.user._id,
        repositoryId: repository._id,
        filePath,
        commitMessage: msg,
        commitSha: result.commit?.sha || 'unknown',
        branch: repository.defaultBranch || 'main',
      });
    } catch (dbErr) {
      console.error('[REPOSITORY CONTROLLER] Failed to save commit record to database:', dbErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: `File ${filePath} committed successfully!`,
      commitSha: result.commit?.sha,
    });
  } catch (error) {
    console.error('[REPOSITORY CONTROLLER] Failed to commit documentation:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to commit file to GitHub: ' + (error.response?.data?.message || error.message),
    });
  }
};

export const getPlatformCommits = async (req, res, next) => {
  try {
    const { id: repositoryId } = req.params;

    const commits = await Commit.find({
      repositoryId,
      userId: req.user._id,
    })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: commits.length,
      commits,
    });
  } catch (error) {
    console.error('[REPOSITORY CONTROLLER] Failed to fetch platform commits:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve platform commits history.',
    });
  }
};

export default {
  listConnectedRepos,
  connectRepo,
  getRepoDetails,
  syncRepo,
  disconnectRepo,
  getFileContent,
  searchRepositoryIndex,
  commitDocFile,
  getPlatformCommits,
};

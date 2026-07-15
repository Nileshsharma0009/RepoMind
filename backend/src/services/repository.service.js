import Repository from '../models/Repository.js';
import User from '../models/User.js';
import { fetchRepoTree, fetchFileContent } from './github.service.js';
import { classifyFile, parseImportsAndExports } from './parser.service.js';
import { indexRepositoryChunks } from './indexing.service.js';
import path from 'path';

/**
 * Builds a hierarchical tree from a flat list of Git tree nodes.
 * @param {Array} items - Flat list of Git tree nodes (containing path, type)
 * @returns {Array} Nested tree nodes
 */
const buildFileTree = (items) => {
  const root = { name: 'root', type: 'dir', children: [] };

  for (const item of items) {
    const parts = item.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      let child = current.children.find((c) => c.name === part);
      if (!child) {
        child = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          type: isLast && item.type === 'blob' ? 'file' : 'dir',
        };
        if (child.type === 'dir') {
          child.children = [];
        }
        current.children.push(child);
      }
      current = child;
    }
  }

  // Sort: directories first, then files alphabetically
  const sortTree = (node) => {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'dir' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortTree);
    }
  };

  sortTree(root);
  return root.children;
};

// Ignore lists for parsing
const IGNORED_DIRECTORIES = [
  'node_modules',
  '.git',
  '.github',
  'build',
  'dist',
  'out',
  'target',
  'bin',
  'obj',
  '.next',
  '.nuxt',
  '.cache',
  'tmp',
  'temp',
  'vendor',
  'coverage',
];

const IGNORED_FILES = [
  '.ds_store',
  'thumbs.db',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'composer.lock',
];

const IGNORED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', // images
  '.pdf', '.epub', // docs
  '.zip', '.gz', '.tar', '.rar', '.7z', // archives
  '.mp3', '.mp4', '.mkv', '.avi', '.mov', // media
  '.woff', '.woff2', '.ttf', '.eot', // fonts
  '.db', '.sqlite', '.exe', '.dll', '.so', '.dylib', // binaries / databases
];

/**
 * Checks if a path or filename matches the ignore rules.
 */
const shouldIgnore = (filePath, type) => {
  const parts = filePath.split('/');
  
  // 1. Check if any segment of the path is in the ignored directories
  if (parts.some((part) => IGNORED_DIRECTORIES.includes(part.toLowerCase()))) {
    return true;
  }

  const filename = parts[parts.length - 1].toLowerCase();

  // 2. Check hidden files or specific filenames
  if (filename.startsWith('.') || IGNORED_FILES.includes(filename)) {
    return true;
  }

  // 3. Check for binary / asset extensions
  const ext = path.extname(filename);
  if (type === 'blob' && IGNORED_EXTENSIONS.includes(ext)) {
    return true;
  }

  return false;
};

/**
 * Runs the recursive parsing of the repository in the background.
 */
export const indexRepositoryBackground = async (repositoryId, userId) => {
  console.log(`[PARSER] Starting background indexing for Repository: ${repositoryId}`);
  
  try {
    // 1. Fetch active repository from db
    const repo = await Repository.findById(repositoryId);
    if (!repo) {
      console.error(`[PARSER] Repository not found: ${repositoryId}`);
      return;
    }

    // Update status to indexing
    repo.status = 'indexing';
    await repo.save();

    // 2. Fetch User to get githubAccessToken
    const user = await User.findById(userId).select('+githubAccessToken');
    if (!user || !user.githubAccessToken) {
      throw new Error('User not found or GitHub access token missing.');
    }

    const accessToken = user.githubAccessToken;

    // 3. Fetch GitHub recursive tree
    const rawTree = await fetchRepoTree(repo.owner, repo.name, repo.defaultBranch, accessToken);
    console.log(`[PARSER] Retrieved ${rawTree.length} total items from GitHub Git Tree API`);

    // 4. Filter tree elements
    const filteredTree = rawTree.filter((item) => !shouldIgnore(item.path, item.type));
    console.log(`[PARSER] Filtered down to ${filteredTree.length} files/folders to process`);

    // Build directory list and file list
    const folders = filteredTree.filter((item) => item.type === 'tree').map((item) => item.path);
    const rawFiles = filteredTree.filter((item) => item.type === 'blob');

    const parsedFiles = [];
    const extensionStats = new Map();
    const typeStats = new Map();

    // Parse each file
    let fileIndex = 0;
    for (const file of rawFiles) {
      fileIndex++;
      const ext = path.extname(file.path).toLowerCase();
      
      // Update extension count
      extensionStats.set(ext, (extensionStats.get(ext) || 0) + 1);

      // Skip reading content for large files (> 150KB)
      const maxParseSize = 150 * 1024;
      let imports = [];
      let exports = [];
      let fileType = 'other';

      if (file.size && file.size < maxParseSize) {
        try {
          console.log(`[PARSER] [${fileIndex}/${rawFiles.length}] Parsing file: ${file.path}`);
          const content = await fetchFileContent(repo.owner, repo.name, file.sha, accessToken);
          
          fileType = classifyFile(file.path);
          const parsed = parseImportsAndExports(content, ext);
          imports = parsed.imports;
          exports = parsed.exports;
        } catch (fileErr) {
          console.warn(`[PARSER] Warning: failed to parse file content for ${file.path}:`, fileErr.message);
        }
      } else {
        // Just classify path if file is too big or size not provided
        fileType = classifyFile(file.path);
      }

      // Update type counts
      typeStats.set(fileType, (typeStats.get(fileType) || 0) + 1);

      parsedFiles.push({
        path: file.path,
        name: path.basename(file.path),
        extension: ext,
        size: file.size || 0,
        type: fileType,
        sha: file.sha,
        imports,
        exports,
      });
    }

    // 5. Build hierarchical file tree for frontend
    const fileTree = buildFileTree(filteredTree);

    // 6. Save results to Database
    repo.fileTree = fileTree;
    repo.fileCount = parsedFiles.length;
    repo.status = 'indexed';
    repo.parsedData = {
      folders,
      files: parsedFiles,
      summary: {
        totalFolders: folders.length,
        totalFiles: parsedFiles.length,
        extensions: Object.fromEntries(extensionStats),
        types: Object.fromEntries(typeStats),
      },
    };
    repo.errorMessage = '';
    await repo.save();

    // Trigger code chunking & RAG indexing in the background
    setTimeout(() => {
      indexRepositoryChunks(repo._id, userId);
    }, 100);

    console.log(`[PARSER] Successfully indexed repository ${repo.fullName} with ${repo.fileCount} files.`);
  } catch (err) {
    console.error(`[PARSER] Background indexing failed for repository ${repositoryId}:`, err.message);
    try {
      await Repository.findByIdAndUpdate(repositoryId, {
        status: 'failed',
        errorMessage: err.message,
      });
    } catch (dbErr) {
      console.error('[PARSER] Double fault updating repository status:', dbErr.message);
    }
  }
};

/**
 * Creates a connected repository record and kicks off the background crawler.
 */
export const connectRepository = async (repoDetails, userId) => {
  const existingRepo = await Repository.findOne({
    userId,
    githubId: String(repoDetails.githubId),
  });

  if (existingRepo) {
    // If it exists, re-trigger indexing if it failed or is connected
    existingRepo.status = 'connected';
    existingRepo.errorMessage = '';
    await existingRepo.save();

    // Trigger async index
    setTimeout(() => {
      indexRepositoryBackground(existingRepo._id, userId);
    }, 100);

    return existingRepo;
  }

  // Create new repository entry
  const newRepo = await Repository.create({
    userId,
    githubId: String(repoDetails.githubId),
    name: repoDetails.name,
    fullName: repoDetails.fullName,
    description: repoDetails.description || '',
    owner: repoDetails.owner,
    url: repoDetails.url || '',
    defaultBranch: repoDetails.defaultBranch || 'main',
    status: 'connected',
  });

  // Trigger async index
  setTimeout(() => {
    indexRepositoryBackground(newRepo._id, userId);
  }, 100);

  return newRepo;
};

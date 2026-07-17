import Repository from '../models/Repository.js';
import Documentation from '../models/Documentation.js';
import env from '../config/env.js';
import { GoogleGenAI } from '@google/genai';
import { fetchFileContent } from './github.service.js';
import limiter from '../utils/limiter.js';

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || env.geminiApiKey;
  if (!apiKey || apiKey === 'dummy_gemini_api_key') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const getFallbackDoc = (repo, type) => {
  const filesList = repo.parsedData?.files || [];
  const foldersList = repo.parsedData?.folders || [];
  
  const routes = filesList.filter(f => f.type === 'route').map(f => `- **${f.name}** (\`${f.path}\`)`);
  const controllers = filesList.filter(f => f.type === 'controller').map(f => `- **${f.name}** (\`${f.path}\`)`);
  const services = filesList.filter(f => f.type === 'service').map(f => `- **${f.name}** (\`${f.path}\`)`);
  const models = filesList.filter(f => f.type === 'model').map(f => `- **${f.name}** (\`${f.path}\`)`);

  switch (type.toLowerCase()) {
    case 'readme':
      return `# ${repo.name} - Codebase Overview

${repo.description || 'No description provided.'}

This developer guide was automatically generated using **RepoMind's** code crawling agent.

## Repository Profile
- **Active Codebase**: \`${repo.fullName}\`
- **Default Branch**: \`${repo.defaultBranch}\`
- **Total Indexed Files**: ${repo.fileCount}
- **Folders Segmented**: ${foldersList.length}

## Project Layout Outline
- **Modules Breakdown**:
  - Routes: ${routes.length} controllers entry-points.
  - Controllers: ${controllers.length} request handlers.
  - Services: ${services.length} business logic services.
  - Models: ${models.length} database schemas.

## Developer Setup
1. Clone your github repository:
   \`\`\`bash
   git clone ${repo.url}
   \`\`\`
2. Navigate to project root, install packages, and verify your \`.env\` configurations.
`;

    case 'api':
      return `# API Reference - ${repo.name}

This document details the route endpoints and controllers mapped inside the **${repo.name}** codebase.

## Express Routes & Controllers Mapping

### Active Route Handlers (${routes.length})
${routes.length === 0 ? '_No route files indexed._' : routes.join('\n')}

### Controllers Handler Mapping (${controllers.length})
${controllers.length === 0 ? '_No controller files indexed._' : controllers.join('\n')}

## Request Flow
Client Request ➔ Router (\`/api/...\`) ➔ Middleware Protection ➔ Controller Handler ➔ Service Logic ➔ DB Document.
`;

    case 'folder':
      return `# Folder Structure Docs - ${repo.name}

Detailed directory breakdown of the **${repo.name}** source tree.

## Root Folder Structure
${foldersList.map(folder => `- \`${folder}\``).slice(0, 15).join('\n')}

## Source Files Categories
- **Indexed Files**: ${filesList.length} modules.
- **Extensions**: ${Object.keys(repo.parsedData?.summary?.extensions || {}).join(', ')}
`;

    case 'setup':
      return `# Installation & Local Setup Guide - ${repo.name}

Follow these instructions to run the **${repo.name}** application locally.

## Prerequisites
- **Node.js** (v16+ recommended)
- **MongoDB** instance (local or Atlas)

## Step-by-Step Installation

1. **Install Dependencies**:
   \`\`\`bash
   npm install
   \`\`\`
2. **Environment Variables**:
   Create a \`.env\` file in your server folder and configure the following variables:
   - \`PORT\`: API listener port (default \`5000\`)
   - \`MONGO_URI\`: MongoDB connection string
   - \`JWT_SECRET\`: JSON Web Token secret key

3. **Launch Local Services**:
   Run in development mode:
   \`\`\`bash
   npm run dev
   \`\`\`
`;

    case 'deployment':
      return `# Deployment Guide - ${repo.name}

Production deployment instructions for the **${repo.name}** codebase.

## Production Builds
1. Build frontend bundle:
   \`\`\`bash
   npm run build
   \`\`\`
2. Configure environment keys: Ensure production keys for databases and OAuth secrets are active.

## Server Deployment
Deploy to services like Heroku, Render, AWS Elastic Beanstalk, or run containerized inside Docker.
`;

    case 'architecture':
      return `# Architecture Manual - ${repo.name}

## System Overview
The **${repo.name}** repository is designed using a **Clean Layered Architecture** with distinct layers isolating router endpoints, controllers, models, and service classes.

## Layer Segmentations

### 1. Presentation & Routing Layer
Contains express router declarations routing HTTP methods to controller logic.
${routes.slice(0, 10).join('\n')}

### 2. Controller Request Handlers
Parses request parameters, validates access, and delegates to services.
${controllers.slice(0, 10).join('\n')}

### 3. Business Service Layer
Orchestrates transactions and aggregates data lookups.
${services.slice(0, 10).join('\n')}

### 4. Persistence Models
Database schema definitions matching Mongo collection layouts.
${models.slice(0, 10).join('\n')}
`;

    case 'release':
      return `# Release Notes - Version 1.0.0

Initial launch specifications for the codebase **${repo.name}**.

## Core Systems
- Connected Github branches integration.
- Mapped Express routers and parsed modules import stats.
- Auto-indexing code segments.
`;

    case 'changelog':
      return `# Changelog

### Version 1.0.0
- **Codebase Indexing**: Connected codebase crawled and mapped.
- **RAG Services**: Segmented ${repo.fileCount} source files into search chunks.
- **AI Chat Coordinator**: Activated chat explanations and Monaco line-highlighting.
`;

    default:
      return `# Developer Guide\n\nNo template matches category: ${type}`;
  }
};

export const generateDocumentation = async (repositoryId, type, accessToken) => {
  const repo = await Repository.findById(repositoryId);
  if (!repo) {
    throw new Error('Repository not found.');
  }

  // Check MongoDB cache first
  const docType = type.toLowerCase();
  const cachedDoc = await Documentation.findOne({ repositoryId, type: docType });
  if (cachedDoc) {
    return cachedDoc.content;
  }

  const genAI = getGenAI();
  if (!genAI) {
    return getFallbackDoc(repo, type);
  }

  const filesList = repo.parsedData?.files || [];
  const listStr = filesList.map(f => `- File: ${f.path} (Type: ${f.type}, Extension: ${f.extension})`).slice(0, 60).join('\n');

  // Gather specific root files metadata (dependencies, packages, build configurations)
  let rootMetadata = '';
  if (accessToken) {
    try {
      const packageFiles = filesList.filter(f => f.name.toLowerCase() === 'package.json');
      for (const pf of packageFiles) {
        try {
          const rawContent = await fetchFileContent(repo.owner, repo.name, pf.sha, accessToken);
          const pkg = JSON.parse(rawContent);
          const deps = Object.keys(pkg.dependencies || {}).join(', ');
          const devDeps = Object.keys(pkg.devDependencies || {}).join(', ');
          const scripts = Object.entries(pkg.scripts || {}).map(([k, v]) => `"${k}": "${v}"`).join(', ');
          rootMetadata += `\n### Package config file: "${pf.path}":\n- Package Name: ${pkg.name || 'unnamed'}\n- Dependencies: ${deps || 'none'}\n- Dev Dependencies: ${devDeps || 'none'}\n- Run Scripts: ${scripts || 'none'}\n`;
        } catch (err) {
          console.warn(`[DOC SERVICE] Failed to parse package.json at ${pf.path}:`, err.message);
        }
      }

      const envFiles = filesList.filter(f => 
        f.name.toLowerCase().includes('.env.example') || 
        f.name.toLowerCase().includes('.env.sample') ||
        f.name.toLowerCase() === '.env'
      );
      for (const ef of envFiles) {
        try {
          const rawContent = await fetchFileContent(repo.owner, repo.name, ef.sha, accessToken);
          const envKeys = rawContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#') && line.includes('='))
            .map(line => line.split('=')[0])
            .join(', ');
          rootMetadata += `\n### Discovered Environment Keys in: "${ef.path}":\n- Keys: ${envKeys || 'none'}\n`;
        } catch (err) {
          console.warn(`[DOC SERVICE] Failed to read environment keys from ${ef.path}:`, err.message);
        }
      }
    } catch (crawlErr) {
      console.warn('[DOC SERVICE] Failed to gather setup metadata details:', crawlErr.message);
    }
  }

  let prompt = '';
  switch (docType) {
    case 'readme':
      prompt = `Write a comprehensive, professional README.md developer overview for the repository named "${repo.name}".
Description: ${repo.description || 'Software codebase.'}
File count: ${repo.fileCount}
Files list preview:
${listStr}

Structure:
- Title
- Project Description
- Codebase Directory Architecture explanation
- Development environment configurations needed
Provide professional markdown.`;
      break;

    case 'api':
      prompt = `Write a detailed API Reference markdown document for the repository "${repo.name}".
Look at the list of route/controller files from this preview:
${listStr}
Generate detailed instructions on how HTTP requests travel through routes to controllers, citing specific file paths in the codebase.`;
      break;

    case 'folder':
      prompt = `Write a Folder Structure Documentation guide explaining directories layout in "${repo.name}".
Files overview:
${listStr}
Explain the purpose of directories like frontend, backend, routes, controllers, services, models.`;
      break;

    case 'setup':
      prompt = `Write a highly specific, customized Installation and Setup guide for "${repo.name}".
We analyzed the codebase configurations and found the following package specifications and environment requirements:
${rootMetadata || 'No specific root configurations parsed.'}

Also use this codebase file list:
${listStr}

Requirements:
- Focus ONLY on the actual tech stack, packages, scripts, and environment keys defined in the metadata. Do not suggest generic setup technologies that do not exist in this project.
- Detail step-by-step instructions on cloning the repo, running package installation commands (like npm install or yarn install based on the package files), configuring the exact environment keys listed above, and launching the services in development mode using the actual scripts found in package.json.
- Make it a complete, production-grade guide using professional markdown.`;
      break;

    case 'deployment':
      prompt = `Write a production Deployment Guide for the repository "${repo.name}".
Use the discovered package configurations and environments:
${rootMetadata || 'No specific root configurations parsed.'}

Also use this codebase file list:
${listStr}

Requirements:
- Focus ONLY on the correct way to build and deploy this specific tech stack. Detail how to build (e.g. run production build commands from package.json) and serve frontend/backend folders.
- Explain how to configure production databases, environment variables (use the exact key names found in our env configurations), and reverse proxy API endpoints.
- Recommend hosting solutions matching this tech stack (e.g., Node/Express backend, React frontend on Render/Vercel/AWS/Docker, etc.).`;
      break;

    case 'architecture':
      prompt = `Write an Architecture Manual describing the structure of "${repo.name}".
Codebase overview:
${listStr}
Explain how routes, controllers, services, and models interact. Frame it as a Clean Architecture pattern, citing file paths.`;
      break;

    case 'release':
      prompt = `Write Release Notes for version 1.0.0 of "${repo.name}". List release features based on this module distribution:\n${listStr}`;
      break;

    case 'changelog':
      prompt = `Write a Changelog document for version 1.0.0 release of "${repo.name}". Describe the implementation of codebase crawler, chunk parser, and AI chat.`;
      break;

    default:
      return getFallbackDoc(repo, type);
  }

  try {
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
            contents: prompt,
          })
        );
        break;
      } catch (err) {
        console.warn(`[DOC SERVICE] Model ${modelName} failed:`, err.message);

        // Stop fallbacks immediately on 429 rate limit
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

    // Cache the successful documentation result in MongoDB
    await Documentation.findOneAndUpdate(
      { repositoryId, type: docType },
      { content: responseText },
      { upsert: true, new: true }
    );

    return responseText;
  } catch (err) {
    const errMsg = err.message || '';
    const isRateLimit =
      errMsg.includes('429') ||
      errMsg.toLowerCase().includes('quota') ||
      errMsg.toLowerCase().includes('rate limit') ||
      errMsg.toLowerCase().includes('resource_exhausted') ||
      err.status === 429;

    // Bubble up 429 rate limit errors so the controller can handle them gracefully
    if (isRateLimit) {
      throw err;
    }

    console.warn('[DOC SERVICE] Gemini gen failure, returning template fallback:', err.message);
    return getFallbackDoc(repo, type);
  }
};

export default {
  generateDocumentation,
};

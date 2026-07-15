import Repository from '../models/Repository.js';
import env from '../config/env.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || env.geminiApiKey;
  if (!apiKey || apiKey === 'dummy_gemini_api_key') {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
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

/**
 * Dynamically generates structured developer documents.
 */
export const generateDocumentation = async (repositoryId, type) => {
  const repo = await Repository.findById(repositoryId);
  if (!repo) {
    throw new Error('Repository not found.');
  }

  const genAI = getGenAI();
  if (!genAI) {
    return getFallbackDoc(repo, type);
  }

  const filesList = repo.parsedData?.files || [];
  const listStr = filesList.map(f => `- File: ${f.path} (Type: ${f.type}, Extension: ${f.extension})`).slice(0, 60).join('\n');

  let prompt = '';
  switch (type.toLowerCase()) {
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
      prompt = `Write an Installation and Setup guide for "${repo.name}".
Based on this codebase file overview:
${listStr}
Structure step-by-step setup guides (npm install, local environment setups, Mongo connections).`;
      break;

    case 'deployment':
      prompt = `Write a production Deployment Guide for "${repo.name}". Focus on configuring production DBs, environment keys, running build commands, and hosting details.`;
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
    let result;
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      result = await model.generateContent(prompt);
    } catch (err) {
      const errMsg = err.message || '';
      if (errMsg.includes('404') || errMsg.toLowerCase().includes('not found')) {
        console.warn('[DOC SERVICE] gemini-1.5-flash failed, trying gemini-1.5-flash-latest...');
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
          result = await model.generateContent(prompt);
        } catch (err2) {
          console.warn('[DOC SERVICE] gemini-1.5-flash-latest failed, trying gemini-pro...');
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
          result = await model.generateContent(prompt);
        }
      } else {
        throw err;
      }
    }
    return result.response.text();
  } catch (err) {
    console.warn('[DOC SERVICE] Gemini gen failure, returning template fallback:', err.message);
    return getFallbackDoc(repo, type);
  }
};

export default {
  generateDocumentation,
};

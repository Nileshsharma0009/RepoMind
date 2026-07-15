import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const rootEnvPath = path.resolve(process.cwd(), '.env');
const backendEnvPath = path.resolve(process.cwd(), 'backend', '.env');
const parentEnvPath = path.resolve(process.cwd(), '..', '.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(parentEnvPath)) {
  dotenv.config({ path: parentEnvPath });
} else {
  dotenv.config();
}

const optionalEnvVars = [
  'GEMINI_API_KEY',
  'PINECONE_API_KEY',
  'PINECONE_INDEX',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
];

export const validateEnv = () => {
  const missing = [];

  if (!process.env.PORT) missing.push('PORT');
  if (!process.env.MONGODB_URL && !process.env.MONGO_URI) missing.push('MONGODB_URL');
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');

  if (missing.length > 0) {
    console.warn(`[WARNING] Missing required environment variables: ${missing.join(', ')}`);
  }

  const missingOptional = optionalEnvVars.filter((v) => !process.env[v]);
  if (missingOptional.length > 0) {
    console.warn(`[INFO] Optional env vars not set yet: ${missingOptional.join(', ')}`);
  }
};

export default {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'repomind_secret_development_key_123456',
  mongoUri: process.env.MONGODB_URL || process.env.MONGO_URI || '',
  pineconeApiKey: process.env.PINECONE_API_KEY || '',
  pineconeIndex: process.env.PINECONE_INDEX || 'repomind-index',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  githubRedirectUri:
    process.env.GITHUB_REDIRECT_URI || 'http://localhost:5000/api/auth/github/callback',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

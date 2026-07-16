import { getEmbedding } from './src/services/embedding.service.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    const emb = await getEmbedding('Hello from RepoMind');
    if (emb) {
      console.log('[VERIFICATION] Returned vector length:', emb.length);
    } else {
      console.error('[VERIFICATION] Failed to get embedding.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();

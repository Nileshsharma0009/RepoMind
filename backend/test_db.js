import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import Repository from './src/models/Repository.js';

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    const repo = await Repository.findOne().sort({ updatedAt: -1 });
    if (!repo) {
      console.log('No repository found in database.');
      return;
    }

    console.log('Repository:', repo.fullName);
    const targetPath = 'backend/src/middleware/auth.middleware.js';
    const file = repo.parsedData?.files?.find((f) => f.path === targetPath);
    
    if (file) {
      console.log('FOUND FILE IN DATABASE:');
      console.log(JSON.stringify(file, null, 2));
    } else {
      console.log(`FILE NOT FOUND: "${targetPath}"`);
      console.log('Existing files starting with "backend/src/middleware":');
      const filtered = repo.parsedData?.files?.filter(f => f.path.startsWith('backend/src/middleware')) || [];
      filtered.forEach(f => console.log(`- ${f.path} (sha: ${f.sha})`));
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

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

    console.log('Latest Repository:', repo.fullName);
    console.log('Status:', repo.status);
    console.log('File Count:', repo.fileCount);
    console.log('Error Message:', repo.errorMessage);
    
    if (repo.parsedData && repo.parsedData.files && repo.parsedData.files.length > 0) {
      console.log('\nSample Files and Imports:');
      const sampleFiles = repo.parsedData.files.filter(f => f.imports && f.imports.length > 0).slice(0, 10);
      
      if (sampleFiles.length === 0) {
        console.log('No files with imports found. Listing first 10 files overall:');
        repo.parsedData.files.slice(0, 10).forEach(f => {
          console.log(`- Path: ${f.path}`);
          console.log(`  Type: ${f.type}`);
          console.log(`  Imports:`, f.imports);
          console.log(`  Exports:`, f.exports);
        });
      } else {
        sampleFiles.forEach(f => {
          console.log(`- Path: ${f.path}`);
          console.log(`  Type: ${f.type}`);
          console.log(`  Imports:`, f.imports);
          console.log(`  Exports:`, f.exports);
        });
      }
    } else {
      console.log('No parsed files found in the latest repository.');
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();

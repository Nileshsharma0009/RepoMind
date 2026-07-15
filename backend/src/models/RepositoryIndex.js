import mongoose from 'mongoose';

const repositoryIndexSchema = new mongoose.Schema(
  {
    repositoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
      index: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    startLine: {
      type: Number,
      required: true,
    },
    endLine: {
      type: Number,
      required: true,
    },
    embedding: {
      type: [Number],
      select: false, // Exclude by default for performance
    },
  },
  {
    timestamps: true,
  }
);

// Ensure index uniqueness per chunk segment of a repository file
repositoryIndexSchema.index({ repositoryId: 1, filePath: 1, chunkIndex: 1 }, { unique: true });

const RepositoryIndex = mongoose.model('RepositoryIndex', repositoryIndexSchema);

export default RepositoryIndex;

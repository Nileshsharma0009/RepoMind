import mongoose from 'mongoose';

const repositorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    githubId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      default: '',
    },
    defaultBranch: {
      type: String,
      default: 'main',
    },
    status: {
      type: String,
      enum: ['connected', 'indexing', 'indexed', 'failed'],
      default: 'connected',
    },
    fileCount: {
      type: Number,
      default: 0,
    },
    fileTree: {
      type: Object, // Hierarchical file tree
      default: {},
    },
    parsedData: {
      folders: [String],
      files: [
        {
          path: String,
          name: String,
          extension: String,
          sha: String,
          size: Number,
          type: {
            type: String,
            enum: [
              'route',
              'controller',
              'service',
              'model',
              'component',
              'config',
              'middleware',
              'style',
              'markdown',
              'other',
            ],
            default: 'other',
          },
          imports: [String],
          exports: [String],
        },
      ],
      summary: {
        totalFolders: { type: Number, default: 0 },
        totalFiles: { type: Number, default: 0 },
        extensions: { type: Object, default: {} },
        types: { type: Object, default: {} },
      },
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure user has unique connected repositories
repositorySchema.index({ userId: 1, githubId: 1 }, { unique: true });

const Repository = mongoose.model('Repository', repositorySchema);

export default Repository;

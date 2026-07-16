import mongoose from 'mongoose';

const documentationSchema = new mongoose.Schema(
  {
    repositoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      toLowerCase: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee uniqueness per repository + document type combination
documentationSchema.index({ repositoryId: 1, type: 1 }, { unique: true });

const Documentation = mongoose.model('Documentation', documentationSchema);

export default Documentation;

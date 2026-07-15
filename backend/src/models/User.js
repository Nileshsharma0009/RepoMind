import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    githubAccessToken: {
      type: String,
      select: false,
    },
    bio: {
      type: String,
      default: '',
    },
    publicRepos: {
      type: Number,
      default: 0,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toPublicProfile = function toPublicProfile() {
  return {
    id: this._id,
    githubId: this.githubId,
    username: this.username,
    displayName: this.displayName,
    email: this.email,
    avatar: this.avatar,
    bio: this.bio,
    publicRepos: this.publicRepos,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;

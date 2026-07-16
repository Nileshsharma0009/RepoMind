import User from '../models/User.js';
import Repository from '../models/Repository.js';
import Commit from '../models/Commit.js';
import Documentation from '../models/Documentation.js';

export const getAdminDashboardStats = async (req, res, next) => {
  try {
    // 1. Fetch all users
    const allUsers = await User.find().sort({ createdAt: -1 });
    
    // Map stats for each user
    const usersList = [];
    for (const u of allUsers) {
      const userRepos = await Repository.find({ userId: u._id }).select('_id');
      const repoIds = userRepos.map(r => r._id);
      
      const reposCount = userRepos.length;
      const commitsCount = await Commit.countDocuments({ userId: u._id });
      const docsCount = await Documentation.countDocuments({ repositoryId: { $in: repoIds } });
      
      usersList.push({
        id: u._id,
        username: u.username,
        displayName: u.displayName || u.username,
        email: u.email || 'N/A',
        avatar: u.avatar,
        role: u.role || 'user',
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        reposCount,
        commitsCount,
        docsCount,
      });
    }

    // 2. Fetch recent commits logs across all users
    const recentCommits = await Commit.find()
      .populate('userId', 'username avatar displayName')
      .populate('repositoryId', 'name fullName')
      .sort({ createdAt: -1 })
      .limit(50);

    // 3. Compute 6-Month Monthly Graph data
    const monthlyStats = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const reposCreated = await Repository.countDocuments({ createdAt: { $gte: start, $lte: end } });
      const commitsCreated = await Commit.countDocuments({ createdAt: { $gte: start, $lte: end } });
      const docsCreated = await Documentation.countDocuments({ createdAt: { $gte: start, $lte: end } });
      
      monthlyStats.push({
        month: monthName,
        repos: reposCreated,
        commits: commitsCreated,
        docs: docsCreated,
      });
    }

    // 4. Overarching global totals
    const totalUsers = allUsers.length;
    const totalRepos = await Repository.countDocuments();
    const totalCommits = await Commit.countDocuments();
    const totalDocs = await Documentation.countDocuments();

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalUsers,
          totalRepos,
          totalCommits,
          totalDocs,
        },
        users: usersList,
        commitsLog: recentCommits,
        monthlyStats,
      }
    });
  } catch (error) {
    console.error('[ADMIN CONTROLLER] Failed to load dashboard statistics:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to assemble administrator metrics: ' + error.message,
    });
  }
};

export default {
  getAdminDashboardStats,
};

import { fetchUserRepos } from '../services/github.service.js';
import User from '../models/User.js';

export const listRepos = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+githubAccessToken');
    if (!user || !user.githubAccessToken) {
      return res.status(400).json({
        status: 'error',
        message: 'GitHub accounts is not connected or session expired. Please log in again.',
      });
    }

    const repos = await fetchUserRepos(user.githubAccessToken);

    const formattedRepos = repos.map((repo) => ({
      githubId: String(repo.id),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || '',
      owner: repo.owner.login,
      url: repo.html_url,
      defaultBranch: repo.default_branch || 'main',
      isPrivate: repo.private,
      stars: repo.stargazers_count || 0,
      updatedAt: repo.updated_at,
    }));

    res.status(200).json({
      status: 'success',
      results: formattedRepos.length,
      repos: formattedRepos,
    });
  } catch (error) {
    console.error('[GITHUB CONTROLLER] Error fetching repos:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve repositories from GitHub API. ' + error.message,
    });
  }
};

export default {
  listRepos,
};

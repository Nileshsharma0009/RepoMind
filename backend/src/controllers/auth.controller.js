import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import githubConfig from '../config/github.js';
import User from '../models/User.js';
import {
  exchangeCodeForToken,
  fetchGitHubUser,
  fetchGitHubUserEmails,
  getPrimaryEmail,
} from '../services/github.service.js';

const signToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtSecret, {
    expiresIn: '7d',
  });

export const getGitHubAuthUrl = (req, res) => {
  if (!env.githubClientId || env.githubClientId === 'dummy_github_client_id') {
    return res.status(503).json({
      status: 'error',
      message: 'GitHub OAuth is not configured. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to your .env file.',
    });
  }

  const params = new URLSearchParams({
    client_id: githubConfig.clientId,
    redirect_uri: githubConfig.redirectUri,
    scope: githubConfig.scope,
  });

  res.status(200).json({
    status: 'success',
    url: `https://github.com/login/oauth/authorize?${params.toString()}`,
  });
};

export const redirectToGitHub = (req, res) => {
  if (!env.githubClientId || env.githubClientId === 'dummy_github_client_id') {
    return res.redirect(`${env.frontendUrl}/login?error=oauth_not_configured`);
  }

  const params = new URLSearchParams({
    client_id: githubConfig.clientId,
    redirect_uri: githubConfig.redirectUri,
    scope: githubConfig.scope,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};

export const githubCallback = async (req, res) => {
  const { code, error, error_description: errorDescription } = req.query;

  if (error) {
    return res.redirect(
      `${env.frontendUrl}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code) {
    return res.redirect(`${env.frontendUrl}/login?error=missing_code`);
  }

  try {
    const accessToken = await exchangeCodeForToken(code);
    const githubUser = await fetchGitHubUser(accessToken);

    let email = githubUser.email || '';
    if (!email) {
      const emails = await fetchGitHubUserEmails(accessToken);
      email = getPrimaryEmail(emails);
    }

    const user = await User.findOneAndUpdate(
      { githubId: String(githubUser.id) },
      {
        githubId: String(githubUser.id),
        username: githubUser.login,
        displayName: githubUser.name || githubUser.login,
        email,
        avatar: githubUser.avatar_url || '',
        bio: githubUser.bio || '',
        publicRepos: githubUser.public_repos || 0,
        githubAccessToken: accessToken,
        lastLoginAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    const token = signToken(user._id);
    res.redirect(`${env.frontendUrl}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('[AUTH] GitHub callback failed:', err.message);
    res.redirect(`${env.frontendUrl}/login?error=auth_failed`);
  }
};

export const getMe = async (req, res) => {
  res.status(200).json({
    status: 'success',
    user: req.user.toPublicProfile(),
  });
};

export const logout = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.',
  });
};

export const getAuthStatus = (req, res) => {
  const isConfigured =
    env.githubClientId &&
    env.githubClientId !== 'dummy_github_client_id' &&
    env.githubClientSecret &&
    env.githubClientSecret !== 'dummy_github_client_secret';

  res.status(200).json({
    status: 'success',
    githubOAuthConfigured: isConfigured,
    redirectUri: githubConfig.redirectUri,
  });
};

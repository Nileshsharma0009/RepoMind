import axios from 'axios';
import githubConfig from '../config/github.js';

const githubApi = axios.create({
  baseURL: githubConfig.apiUrl,
  headers: {
    Accept: 'application/vnd.github+json',
  },
});

export const exchangeCodeForToken = async (code) => {
  const response = await axios.post(
    githubConfig.tokenUrl,
    {
      client_id: githubConfig.clientId,
      client_secret: githubConfig.clientSecret,
      code,
      redirect_uri: githubConfig.redirectUri,
    },
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

  if (response.data.error) {
    throw new Error(response.data.error_description || response.data.error);
  }

  return response.data.access_token;
};

export const fetchGitHubUser = async (accessToken) => {
  const { data } = await githubApi.get('/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
};

export const fetchGitHubUserEmails = async (accessToken) => {
  const { data } = await githubApi.get('/user/emails', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
};

export const getPrimaryEmail = (emails = []) => {
  const primary = emails.find((entry) => entry.primary && entry.verified);
  if (primary) return primary.email;

  const verified = emails.find((entry) => entry.verified);
  return verified?.email || emails[0]?.email || '';
};

export const fetchUserRepos = async (accessToken) => {
  const { data } = await githubApi.get('/user/repos?per_page=100&sort=updated', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return data;
};

export const fetchRepoTree = async (owner, repo, branch, accessToken) => {
  const { data } = await githubApi.get(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return data.tree || [];
};

export const fetchFileContent = async (owner, repo, fileSha, accessToken) => {
  const { data } = await githubApi.get(`/repos/${owner}/${repo}/git/blobs/${fileSha}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (data.encoding === 'base64') {
    return Buffer.from(data.content, 'base64').toString('utf8');
  }
  return data.content || '';
};


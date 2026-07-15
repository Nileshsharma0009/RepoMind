import env from './env.js';

export const githubConfig = {
  clientId: env.githubClientId,
  clientSecret: env.githubClientSecret,
  redirectUri: env.githubRedirectUri,
  scope: 'read:user user:email repo',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  apiUrl: 'https://api.github.com',
};

export default githubConfig;

import express from 'express';
import {
  getGitHubAuthUrl,
  redirectToGitHub,
  githubCallback,
  getMe,
  logout,
  getAuthStatus,
} from '../controllers/auth.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/status', getAuthStatus);
router.get('/github/url', getGitHubAuthUrl);
router.get('/github', redirectToGitHub);
router.get('/github/callback', githubCallback);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;

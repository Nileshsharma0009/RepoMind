import express from 'express';
import { listRepos } from '../controllers/github.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/repos', protect, listRepos);

export default router;

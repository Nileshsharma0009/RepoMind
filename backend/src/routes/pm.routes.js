import express from 'express';
import { getGitInfo, harvestTodos, runAgentAnalysis } from '../controllers/pm.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // Secure all PM routes

router.get('/:id/git', getGitInfo);
router.get('/:id/todos', harvestTodos);
router.post('/agent/run', runAgentAnalysis);

export default router;

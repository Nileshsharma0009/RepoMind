import express from 'express';
import { getDocumentation } from '../controllers/documentation.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/:id/docs/:type', protect, getDocumentation);

export default router;

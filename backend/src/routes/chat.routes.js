import express from 'express';
import { handleChat } from '../controllers/chat.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, handleChat);

export default router;

import express from 'express';
import { getAdminDashboardStats } from '../controllers/admin.controller.js';
import protect, { admin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply auth protection & admin privilege checks to all admin routes
router.use(protect);
router.use(admin);

router.get('/dashboard', getAdminDashboardStats);

export default router;

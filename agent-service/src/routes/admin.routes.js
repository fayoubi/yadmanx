import express from 'express';
import adminController from '../controllers/admin.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Sync all agents to enrollment service (requires authentication)
router.post('/admin/sync-all-agents', authenticateToken, adminController.syncAllAgents);

export default router;

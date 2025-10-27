import { Router } from 'express';
import { isAuthenticated, requireAdmin } from '../middlewares/auth.js';
import { showConfigDashboard } from '../controllers/configController.js';

const router = Router();

// Configuration dashboard - Admin only
router.get('/config', isAuthenticated, requireAdmin, showConfigDashboard);

export default router;

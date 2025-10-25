import { Router } from 'express';
import { showLogin, login, logout, showDashboard } from '../controllers/authController.js';
import { isAuthenticated, isGuest } from '../middlewares/auth.js';

const router = Router();

router.get('/login', isGuest, showLogin);
router.post('/login', login);
router.get('/logout', logout);
router.get('/dashboard', isAuthenticated, showDashboard);

export default router;

import { Router } from 'express';
import { showLogin, showDashboard } from '../controllers/authController.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = Router();

// Ruta principal - redirige al dashboard si está autenticado, sino al login
router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

export default router;

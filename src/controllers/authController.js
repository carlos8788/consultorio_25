import { authenticateUser } from '../services/authService.js';
import { logger } from '../logger/index.js';

export const showLogin = (req, res) => {
  res.render('pages/login', {
    title: 'Iniciar Sesión',
    layout: 'auth'
  });
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const authResult = await authenticateUser({ username, password });

    if (!authResult) {
      return res.render('pages/login', {
        title: 'Iniciar Sesión',
        layout: 'auth',
        error: 'Credenciales incorrectas'
      });
    }

    req.session.user = authResult.sessionPayload;
    return res.redirect('/dashboard');
  } catch (error) {
    logger.error('Error en login:', error);
    res.status(500).render('error', { error: 'Error al iniciar sesión' });
  }
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error('Error al cerrar sesión:', err);
    }
    res.redirect('/login');
  });
};

export const showDashboard = (req, res) => {
  res.render('pages/dashboard', {
    title: 'Dashboard',
    user: req.session.user
  });
};

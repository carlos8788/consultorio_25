import Paciente from '../models/Paciente.js';

export const showLogin = (req, res) => {
  res.render('pages/login', {
    title: 'Iniciar Sesión',
    layout: 'auth'
  });
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Usuarios permitidos desde variables de entorno
    const validUsers = [
      {
        username: process.env.ADMIN_USER,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
        id: 'admin'
      },
      {
        username: process.env.MELI_USER,
        password: process.env.MELI_PASSWORD,
        role: 'user',
        id: 'meli209'
      }
    ];

    // Buscar usuario válido
    const validUser = validUsers.find(
      user => user.username === username && user.password === password
    );

    if (validUser) {
      req.session.user = {
        id: validUser.id,
        username: validUser.username,
        role: validUser.role
      };

      return res.redirect('/dashboard');
    }

    res.render('pages/login', {
      title: 'Iniciar Sesión',
      layout: 'auth',
      error: 'Credenciales incorrectas'
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).render('error', { error: 'Error al iniciar sesión' });
  }
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
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

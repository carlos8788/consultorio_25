export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
};

export const isGuest = (req, res, next) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (req.session?.user?.role === 'admin') {
    return next();
  }

  const message = 'Acceso no autorizado';
  if (req.accepts('json')) {
    return res.status(403).json({ error: message });
  }

  return res.status(403).render('error', { error: message });
};

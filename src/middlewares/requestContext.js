export const attachRequestContext = (req, res, next) => {
  const user = req.session?.user || null;
  const context = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    doctorId: user?.doctorId || null,
    doctorName: user?.doctorName || null,
    currentPath: req.path
  };

  req.context = context;
  res.locals.user = user;
  res.locals.isAuthenticated = context.isAuthenticated;
  res.locals.currentPath = req.path;
  res.locals.context = context;

  next();
};

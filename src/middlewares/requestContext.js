export const attachRequestContext = (req, res, next) => {
  const user = req.session?.user || null;
  const adminSelectedDoctorId = req.session?.adminSelectedDoctorId || null;
  const adminSelectedDoctorName = req.session?.adminSelectedDoctorName || null;

  const context = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    doctorId: user?.doctorId || null,
    doctorName: user?.doctorName || null,
    currentPath: req.path,
    activeDoctorId: user?.role === 'admin' ? adminSelectedDoctorId : (user?.doctorId || null),
    activeDoctorName: user?.role === 'admin' ? adminSelectedDoctorName : (user?.doctorName || null)
  };

  req.context = context;
  res.locals.user = user;
  res.locals.isAuthenticated = context.isAuthenticated;
  res.locals.isAdmin = context.isAdmin;
  res.locals.activeDoctorId = context.activeDoctorId;
  res.locals.activeDoctorName = context.activeDoctorName;
  res.locals.currentPath = req.path;
  res.locals.context = context;

  next();
};

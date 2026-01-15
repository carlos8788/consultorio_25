import { ROLES } from '../constants/roles.js';

export const requireRole = (roles = []) => (req, res, next) => {
  const role = req.auth?.user?.role || req.context?.user?.role || req.session?.user?.role;
  if (!role || !roles.includes(role)) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  return next();
};

export { ROLES };

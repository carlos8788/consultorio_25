import { extractBearerToken, verifyJwt } from '../utils/jwt.js';

const applyAuthContext = (req, payload) => {
  const user = {
    id: payload?.sub || payload?.id || null,
    username: payload?.username || null,
    role: payload?.role || 'user',
    professionalId: payload?.professionalId || null,
    professionalName: payload?.professionalName || null
  };

  req.auth = {
    user,
    isAdmin: user.role === 'admin'
  };

  req.context = req.context || {};
  req.context.user = user;
  req.context.isAuthenticated = true;
  req.context.isAdmin = user.role === 'admin';
  req.context.professionalId = user.professionalId;
  req.context.professionalName = user.professionalName;
};

export const optionalJwtAuth = (req, _res, next) => {
  const token = extractBearerToken(req);
  if (!token) {
    return next();
  }

  const payload = verifyJwt(token);
  if (payload) {
    applyAuthContext(req, payload);
  }

  next();
};

export const requireJwtAuth = (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'No autorizado: token faltante' });
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  applyAuthContext(req, payload);
  return next();
};

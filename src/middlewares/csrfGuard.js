import { authCookieConfig } from '../config/auth.js';
import { extractBearerToken } from '../utils/jwt.js';
import { parseCookies } from '../utils/cookies.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const csrfGuard = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const bearer = extractBearerToken(req);
  if (bearer) {
    return next();
  }

  const cookies = parseCookies(req);
  const authToken = cookies[authCookieConfig.name];

  if (!authToken) {
    return next();
  }

  const csrfCookie = cookies[authCookieConfig.csrfName];
  const csrfHeader = req.get('x-csrf-token');

  if (!csrfCookie || !csrfHeader || csrfHeader !== csrfCookie) {
    return res.status(403).json({ error: 'CSRF token invalido o faltante' });
  }

  return next();
};

import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { authCookieConfig } from '../config/auth.js';
import { parseCookies } from './cookies.js';

export const signJwt = (payload, options = {}) => {
  const config = { ...jwtConfig, ...options };
  return jwt.sign(payload, config.secret, {
    expiresIn: config.expiresIn,
    issuer: config.issuer,
    ...options
  });
};

export const verifyJwt = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret, {
      issuer: jwtConfig.issuer
    });
  } catch (error) {
    return null;
  }
};

const getHeader = (req, name) => {
  if (!req) return null;
  if (typeof req.get === 'function') {
    return req.get(name);
  }
  return req.headers?.[name.toLowerCase()] || req.headers?.[name] || null;
};

export const extractBearerToken = (req) => {
  const authHeader = getHeader(req, 'authorization') || getHeader(req, 'Authorization');
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token.trim();
};

export const extractAuthToken = (req) => {
  const bearer = extractBearerToken(req);
  if (bearer) return bearer;
  const cookies = parseCookies(req);
  return cookies[authCookieConfig.name] || null;
};

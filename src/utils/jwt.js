import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';

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

export const extractBearerToken = (req) => {
  const authHeader = req.get('authorization') || req.get('Authorization');
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token.trim();
};

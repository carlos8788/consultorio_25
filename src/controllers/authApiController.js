import crypto from 'crypto';
import { authenticateUser } from '../services/authService.js';
import { signJwt } from '../utils/jwt.js';
import { jwtConfig } from '../config/jwt.js';
import { authCookieConfig } from '../config/auth.js';
import { parseDurationToMs } from '../utils/time.js';
import { logger } from '../logger/index.js';

const formatProfessionalName = (professional) => {
  if (!professional) return null;
  const parts = [professional.apellido, professional.nombre].filter(Boolean);
  return parts.length ? parts.join(', ') : professional.userId || null;
};

const buildCookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: authCookieConfig.secure,
  sameSite: authCookieConfig.sameSite,
  domain: authCookieConfig.domain,
  path: authCookieConfig.path,
  ...(maxAgeMs ? { maxAge: maxAgeMs } : {})
});

const buildCsrfCookieOptions = (maxAgeMs) => ({
  httpOnly: false,
  secure: authCookieConfig.secure,
  sameSite: authCookieConfig.sameSite,
  domain: authCookieConfig.domain,
  path: authCookieConfig.path,
  ...(maxAgeMs ? { maxAge: maxAgeMs } : {})
});

export const loginApi = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Faltan credenciales' });
    }

    const authResult = await authenticateUser({ username, password });
    if (!authResult) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const sessionPayload = authResult.sessionPayload || {};
    const professionalId = sessionPayload.professionalId || authResult.professional?._id?.toString() || null;
    const professionalName = sessionPayload.professionalName || formatProfessionalName(authResult.professional);

    const payload = {
      sub: sessionPayload.id || authResult.user.id,
      username: sessionPayload.username || authResult.user.username,
      role: sessionPayload.role || authResult.user.role,
      professionalId,
      professionalName,
    };

    const token = signJwt(payload);
    const maxAgeMs = parseDurationToMs(jwtConfig.expiresIn);
    const csrfToken = crypto.randomBytes(32).toString('hex');

    res.cookie(authCookieConfig.name, token, buildCookieOptions(maxAgeMs));
    res.cookie(authCookieConfig.csrfName, csrfToken, buildCsrfCookieOptions(maxAgeMs));

    return res.json({
      token,
      csrfToken,
      expiresIn: jwtConfig.expiresIn,
      user: {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
        professionalId: payload.professionalId,
        professionalName: payload.professionalName
      }
    });
  } catch (error) {
    logger.error('Error en login API:', error);
    return res.status(500).json({ error: 'No se pudo iniciar sesion' });
  }
};

export const meApi = (req, res) => {
  if (!req.auth?.user) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const professionalId = req.auth.user.professionalId ?? null;
  const professionalName = req.auth.user.professionalName ?? null;

  const user = {
    ...req.auth.user,
    professionalId,
    professionalName,
  };

  return res.json({ user });
};

export const logoutApi = (_req, res) => {
  const base = {
    secure: authCookieConfig.secure,
    sameSite: authCookieConfig.sameSite,
    domain: authCookieConfig.domain,
    path: authCookieConfig.path
  };

  res.clearCookie(authCookieConfig.name, { ...base, httpOnly: true });
  res.clearCookie(authCookieConfig.csrfName, { ...base, httpOnly: false });
  return res.json({ success: true });
};

import { authenticateUser } from '../services/authService.js';
import { signJwt } from '../utils/jwt.js';
import { jwtConfig } from '../config/jwt.js';
import { logger } from '../logger/index.js';

const formatProfessionalName = (professional) => {
  if (!professional) return null;
  const parts = [professional.apellido, professional.nombre].filter(Boolean);
  return parts.length ? parts.join(', ') : professional.userId || null;
};

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

    return res.json({
      token,
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

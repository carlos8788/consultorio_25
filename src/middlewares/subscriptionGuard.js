import { getActiveSubscription } from '../services/subscriptionService.js';
import { isAdminRole, ROLES } from '../constants/roles.js';

const extractRole = (req) =>
  req.auth?.user?.role || req.context?.user?.role || req.session?.user?.role || null;

const extractProfessionalId = (req) =>
  req.auth?.user?.professionalId ||
  req.context?.professionalId ||
  req.session?.user?.professionalId ||
  req.body?.professional ||
  req.query?.professionalId ||
  null;

export const requireActiveSubscription = async (req, res, next) => {
  try {
    const role = extractRole(req);
    if (isAdminRole(role)) {
      return next();
    }

    const professionalId = extractProfessionalId(req);
    if (!professionalId) {
      return res.status(400).json({ error: 'No se pudo determinar el profesional para validar suscripción' });
    }

    const activeSub = await getActiveSubscription(professionalId);
    if (!activeSub) {
      const message = 'Suscripción inactiva o vencida';
      return res.status(402).json({ error: message });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Error validando suscripción' });
  }
};

export const forbidAssistantsDelete = (req, res, next) => {
  const role = extractRole(req);
  if (role === ROLES.ASSISTANT) {
    return res.status(403).json({ error: 'No tienes permisos para eliminar' });
  }
  return next();
};

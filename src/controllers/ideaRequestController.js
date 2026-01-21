import { createIdeaRequest } from '../services/ideaRequestService.js';
import { countIdeaRequests } from '../repositories/ideaRequestRepository.js';
import { createThreadFromIdea } from '../services/messageThreadService.js';
import { logger } from '../logger/index.js';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const MAX_PENDING_PER_IP = 5;
const MAX_GLOBAL_PENDING = 500;

const extractIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || null;
};

const toIdeaRequestDTO = (request) => ({
  id: request?._id?.toString?.() || null,
  nombre: request?.nombre || '',
  email: request?.email || '',
  rol: request?.rol || '',
  mensaje: request?.mensaje || '',
  impacto: request?.impacto || '',
  source: request?.source || 'plataforma',
  estado: request?.estado || 'nuevo',
  createdAt: request?.createdAt ? new Date(request.createdAt).toISOString() : null
});

export const createIdeaRequestApi = async (req, res) => {
  try {
    if (req.body?.website || req.body?.honeypot || req.body?.hp) {
      return res.status(400).json({ error: 'Solicitud invalida' });
    }

    const ip = req.publicFormSecurity?.ip || extractIp(req);
    const now = Date.now();
    const windowStart = new Date(now - RATE_LIMIT_WINDOW_MS);

    const globalPending = await countIdeaRequests({ estado: 'nuevo' });
    if (globalPending >= MAX_GLOBAL_PENDING) {
      logger.warn('[idea-request] Capacidad maxima alcanzada', { ip, globalPending });
      return res.status(201).json({ request: null, ignored: true });
    }

    if (ip) {
      const pendingByIp = await countIdeaRequests({ ip, estado: 'nuevo' });
      if (pendingByIp >= MAX_PENDING_PER_IP) {
        return res.status(429).json({ error: 'Limite de solicitudes pendientes alcanzado' });
      }

      const recentCount = await countIdeaRequests({ ip, createdAt: { $gte: windowStart } });
      if (recentCount >= RATE_LIMIT_MAX) {
        return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta mas tarde' });
      }
    }

    const created = await createIdeaRequest({
      ...(req.body || {}),
      ip,
      userAgent: req.get('user-agent')
    });

    const thread = await createThreadFromIdea(created);
    return res.status(201).json({
      request: toIdeaRequestDTO(created),
      threadId: thread?._id?.toString?.() || null
    });
  } catch (error) {
    logger.error('Error al crear idea:', error);
    return res.status(500).json({ error: 'No se pudo crear la idea' });
  }
};

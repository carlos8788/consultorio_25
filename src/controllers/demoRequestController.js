import { createDemoRequest } from '../services/demoRequestService.js';
import { countDemoRequests } from '../repositories/demoRequestRepository.js';
import { logger } from '../logger/index.js';
import { createThreadFromDemo } from '../services/messageThreadService.js';

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

const toDemoRequestDTO = (request) => ({
  id: request?._id?.toString?.() || null,
  nombre: request?.nombre || '',
  email: request?.email || '',
  telefono: request?.telefono || '',
  centro: request?.centro || '',
  mensaje: request?.mensaje || '',
  intent: request?.intent || 'demo',
  source: request?.source || 'landing',
  estado: request?.estado || 'nuevo',
  createdAt: request?.createdAt ? new Date(request.createdAt).toISOString() : null
});

export const createDemoRequestApi = async (req, res) => {
  try {
    const ip = extractIp(req);
    const now = Date.now();
    const windowStart = new Date(now - RATE_LIMIT_WINDOW_MS);

    const globalPending = await countDemoRequests({ estado: 'nuevo' });
    if (globalPending >= MAX_GLOBAL_PENDING) {
      logger.warn('[demo-request] Capacidad maxima alcanzada', { ip, globalPending });
      return res.status(201).json({ request: null, ignored: true });
    }

    if (ip) {
      const pendingByIp = await countDemoRequests({ ip, estado: 'nuevo' });
      if (pendingByIp >= MAX_PENDING_PER_IP) {
        return res.status(429).json({ error: 'Limite de solicitudes pendientes alcanzado' });
      }

      const recentCount = await countDemoRequests({ ip, createdAt: { $gte: windowStart } });
      if (recentCount >= RATE_LIMIT_MAX) {
        return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta mas tarde' });
      }
    }

    const created = await createDemoRequest({ ...(req.body || {}), ip });
    const thread = await createThreadFromDemo(created);
    return res.status(201).json({
      request: toDemoRequestDTO(created),
      threadId: thread?._id?.toString?.() || null
    });
  } catch (error) {
    logger.error('Error al crear solicitud de demo:', error);
    return res.status(500).json({ error: 'No se pudo crear la solicitud de demo' });
  }
};

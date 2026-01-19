import { WebSocketServer } from 'ws';
import { extractAuthToken, verifyJwt } from '../utils/jwt.js';
import { isAdminRole } from '../constants/roles.js';
import { logger } from '../logger/index.js';

let wss = null;
const sockets = new Map();
const socketsByUser = new Map();

const addSocket = (ws, { userId, role }) => {
  sockets.set(ws, { userId, role });
  if (!userId) return;
  if (!socketsByUser.has(userId)) {
    socketsByUser.set(userId, new Set());
  }
  socketsByUser.get(userId).add(ws);
};

const removeSocket = (ws) => {
  const info = sockets.get(ws);
  sockets.delete(ws);
  if (!info?.userId) return;
  const bucket = socketsByUser.get(info.userId);
  if (!bucket) return;
  bucket.delete(ws);
  if (!bucket.size) {
    socketsByUser.delete(info.userId);
  }
};

const send = (ws, type, payload) => {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify({ type, payload }));
};

export const initNotificationHub = (server) => {
  wss = new WebSocketServer({ server, path: '/ws/notifications' });

  wss.on('connection', (ws, req) => {
    const token = extractAuthToken(req);
    if (!token) {
      ws.close(1008, 'Token requerido');
      return;
    }

    const payload = verifyJwt(token);
    if (!payload) {
      ws.close(1008, 'Token invalido');
      return;
    }

    const userId = payload.sub || payload.id || null;
    const role = payload.role || 'user';
    addSocket(ws, { userId, role });

    ws.on('close', () => removeSocket(ws));
    ws.on('error', () => removeSocket(ws));
  });

  logger.info('[ws] Notification hub activo');
  return wss;
};

export const notifyAdmins = (type, payload) => {
  if (!wss) return;
  sockets.forEach((info, ws) => {
    if (isAdminRole(info?.role)) {
      send(ws, type, payload);
    }
  });
};

export const notifyUser = (userId, type, payload) => {
  if (!wss || !userId) return;
  const bucket = socketsByUser.get(userId);
  if (!bucket) return;
  bucket.forEach((ws) => send(ws, type, payload));
};

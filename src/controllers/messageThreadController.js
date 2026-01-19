import { logger } from '../logger/index.js';
import {
  buildAccessFilter,
  buildUnreadFilter,
  listThreadsForUser,
  countUnreadForUser,
  getThreadForUser,
  createThreadFromUser,
  createThreadFromAdmin,
  listRecipientsForUser,
  replyToThread,
  markThreadRead,
  markThreadUnread,
  hideThreadForUser
} from '../services/messageThreadService.js';
import { countThreads } from '../repositories/messageThreadRepository.js';

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return false;
};

const isUnreadForUser = (thread, userId) => {
  if (!userId) return false;
  const readBy = thread?.readBy || [];
  return !readBy.some((entry) => entry?.toString?.() === userId);
};

const lastMessagePreview = (thread) => {
  const messages = thread?.messages || [];
  if (!messages.length) return { body: '', authorName: '' };
  const last = messages[messages.length - 1];
  return {
    body: last?.body || '',
    authorName: last?.author?.name || ''
  };
};

const toThreadPreviewDTO = (thread, userId) => {
  const preview = lastMessagePreview(thread);
  return {
    id: thread?._id?.toString?.() || thread?.id || null,
    subject: thread?.subject || '',
    category: thread?.category || 'mensaje',
    channel: thread?.channel || 'app',
    status: thread?.status || 'abierto',
    ownerName: thread?.ownerName || '',
    ownerEmail: thread?.ownerEmail || '',
    ownerPhone: thread?.ownerPhone || '',
    unread: isUnreadForUser(thread, userId),
    lastMessage: preview,
    updatedAt: thread?.updatedAt ? new Date(thread.updatedAt).toISOString() : null,
    createdAt: thread?.createdAt ? new Date(thread.createdAt).toISOString() : null
  };
};

const toThreadDetailDTO = (thread, userId) => ({
  id: thread?._id?.toString?.() || thread?.id || null,
  subject: thread?.subject || '',
  category: thread?.category || 'mensaje',
  channel: thread?.channel || 'app',
  status: thread?.status || 'abierto',
  ownerName: thread?.ownerName || '',
  ownerEmail: thread?.ownerEmail || '',
  ownerPhone: thread?.ownerPhone || '',
  unread: isUnreadForUser(thread, userId),
  messages: (thread?.messages || []).map((message) => ({
    id: message?._id?.toString?.() || null,
    author: {
      name: message?.author?.name || '',
      email: message?.author?.email || '',
      role: message?.author?.role || ''
    },
    body: message?.body || '',
    createdAt: message?.createdAt ? new Date(message.createdAt).toISOString() : null
  })),
  updatedAt: thread?.updatedAt ? new Date(thread.updatedAt).toISOString() : null,
  createdAt: thread?.createdAt ? new Date(thread.createdAt).toISOString() : null
});

export const listThreadsApi = async (req, res) => {
  try {
    const user = req.auth?.user;
    const page = req.query?.page || 1;
    const limit = req.query?.limit || 20;
    const unreadOnly = parseBoolean(req.query?.unreadOnly);
    const status = req.query?.status || undefined;

    const filter = unreadOnly ? buildUnreadFilter(user) : buildAccessFilter(user);
    if (status) {
      filter.status = status;
    }

    const [threads, total] = await Promise.all([
      listThreadsForUser(user, { page, limit, unreadOnly, status }),
      countThreads(filter)
    ]);

    return res.json({
      threads: threads.map((thread) => toThreadPreviewDTO(thread, user?.id)),
      pagination: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total
      }
    });
  } catch (error) {
    logger.error('Error al listar mensajes:', error);
    return res.status(500).json({ error: 'No se pudieron obtener los mensajes' });
  }
};

export const getThreadApi = async (req, res) => {
  try {
    const user = req.auth?.user;
    const thread = await getThreadForUser(req.params.id, user);
    if (!thread) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }
    return res.json({ thread: toThreadDetailDTO(thread, user?.id) });
  } catch (error) {
    logger.error('Error al obtener mensaje:', error);
    return res.status(500).json({ error: 'No se pudo obtener el mensaje' });
  }
};

export const createThreadApi = async (req, res) => {
  try {
    const user = req.auth?.user;
    const { subject, message, recipientType, recipientId } = req.body || {};

    const thread = user?.role === 'admin' || user?.role === 'superadmin'
      ? await createThreadFromAdmin({
        user,
        subject,
        body: message,
        recipientType,
        recipientId
      })
      : await createThreadFromUser({
        user,
        subject,
        body: message,
        recipientType,
        recipientId
      });

    return res.status(201).json({ thread: toThreadDetailDTO(thread, user?.id) });
  } catch (error) {
    logger.error('Error al crear mensaje:', error);
    return res.status(error.status || 500).json({ error: error.message || 'No se pudo crear el mensaje' });
  }
};

export const listRecipientsApi = async (req, res) => {
  try {
    const user = req.auth?.user;
    const recipients = await listRecipientsForUser(user);
    return res.json({ recipients });
  } catch (error) {
    logger.error('Error al listar destinatarios:', error);
    return res.status(500).json({ error: 'No se pudieron obtener los destinatarios' });
  }
};

export const replyThreadApi = async (req, res) => {
  try {
    const user = req.auth?.user;
    const { message } = req.body || {};

    const thread = await getThreadForUser(req.params.id, user);
    if (!thread) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    const updated = await replyToThread({
      threadId: thread._id?.toString?.() || thread.id,
      user,
      body: message
    });

    return res.json({ thread: toThreadDetailDTO(updated, user?.id) });
  } catch (error) {
    logger.error('Error al responder mensaje:', error);
    return res.status(500).json({ error: 'No se pudo responder el mensaje' });
  }
};

export const markThreadReadApi = async (req, res) => {
  try {
    const user = req.auth?.user;
    const thread = await getThreadForUser(req.params.id, user);
    if (!thread) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    await markThreadRead(thread._id?.toString?.() || thread.id, user?.id);
    return res.json({ success: true });
  } catch (error) {
    logger.error('Error al marcar mensaje como leido:', error);
    return res.status(500).json({ error: 'No se pudo actualizar el mensaje' });
  }
};

export const markThreadUnreadApi = async (req, res) => {
  try {
    const user = req.auth?.user;
    const thread = await getThreadForUser(req.params.id, user);
    if (!thread) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    await markThreadUnread(thread._id?.toString?.() || thread.id, user?.id);
    return res.json({ success: true });
  } catch (error) {
    logger.error('Error al marcar mensaje como no leido:', error);
    return res.status(500).json({ error: 'No se pudo actualizar el mensaje' });
  }
};

export const deleteThreadApi = async (req, res) => {
  try {
    const user = req.auth?.user;
    const thread = await getThreadForUser(req.params.id, user);
    if (!thread) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    await hideThreadForUser(thread._id?.toString?.() || thread.id, user?.id);
    return res.json({ success: true });
  } catch (error) {
    logger.error('Error al eliminar mensaje:', error);
    return res.status(500).json({ error: 'No se pudo eliminar el mensaje' });
  }
};

export const getUnreadCountApi = async (req, res) => {
  try {
    const user = req.auth?.user;
    const total = await countUnreadForUser(user);
    return res.json({ unread: total });
  } catch (error) {
    logger.error('Error al contar mensajes sin leer:', error);
    return res.status(500).json({ error: 'No se pudo obtener el conteo' });
  }
};

import {
  createThread as createThreadRepo,
  addMessageToThread,
  listThreads as listThreadsRepo,
  countThreads as countThreadsRepo,
  getThreadById,
  updateThread,
  markThreadUnread as markThreadUnreadRepo,
  hideThreadForUser as hideThreadForUserRepo
} from '../repositories/messageThreadRepository.js';
import MessageThread from '../models/MessageThread.js';
import { getUserAccountById, listAdminEmails } from '../repositories/userAccountRepository.js';
import { getProfessionalById, findByUserId, listProfessionals as listProfessionalsRepo } from '../repositories/professionalRepository.js';
import { listUserAccounts } from '../repositories/userAccountRepository.js';
import { isAdminRole } from '../constants/roles.js';
import { sendInboxNotificationEmail, sendThreadReplyEmail } from './emailService.js';
import { notifyAdmins, notifyUser } from '../realtime/notificationHub.js';

const MAX_SUBJECT_LENGTH = 200;
const MAX_BODY_LENGTH = 4000;

const sanitizeText = (value, maxLength) => {
  if (typeof value !== 'string') return '';
  const cleaned = value
    .replace(/\r\n/g, '\n')
    .replace(/[<>]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim();
  if (!maxLength) return cleaned;
  return cleaned.slice(0, maxLength);
};

const isObjectId = (value) =>
  typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);

const readByCastsObjectId = () =>
  MessageThread?.schema?.path('readBy')?.caster?.instance === 'ObjectId';

const canStoreReadBy = (userId) => {
  if (!userId) return false;
  if (!readByCastsObjectId()) return true;
  return isObjectId(userId);
};

const withNotHidden = (filter = {}, userId) => {
  if (!userId) return filter;
  const hiddenFilter = { hiddenBy: { $nin: [userId] } };
  if (!filter || Object.keys(filter).length === 0) {
    return hiddenFilter;
  }
  if (filter.$and) {
    return { ...filter, $and: [...filter.$and, hiddenFilter] };
  }
  return { $and: [filter, hiddenFilter] };
};

const buildAuthorFromUser = (user, account) => {
  const profile = account?.profile || {};
  const nameParts = [profile.apellido, profile.nombre].filter(Boolean);
  return {
    userId: user?.id || null,
    role: user?.role || 'user',
    name: nameParts.length ? nameParts.join(', ') : user?.username || 'Usuario',
    email: profile.email || undefined
  };
};

const buildOwnerInfo = (account, fallback = {}) => {
  const profile = account?.profile || {};
  const nameParts = [profile.apellido, profile.nombre].filter(Boolean);
  const name = nameParts.length ? nameParts.join(', ') : fallback.name || fallback.username || undefined;

  return {
    ownerName: name,
    ownerEmail: profile.email || fallback.email || undefined,
    ownerPhone: profile.telefono || fallback.telefono || undefined
  };
};

const buildAdminNotificationPayload = (thread) => ({
  threadId: thread?._id?.toString?.() || thread?._id || null,
  subject: thread?.subject || 'Nuevo mensaje',
  category: thread?.category || 'mensaje',
  ownerName: thread?.ownerName || '',
  updatedAt: thread?.updatedAt || thread?.createdAt || new Date().toISOString()
});

const getAdminRecipients = async () => {
  const emails = await listAdminEmails();
  return emails.filter(Boolean);
};

const normalizeName = (first, last, fallback) => {
  const parts = [last, first].filter(Boolean);
  if (parts.length) return parts.join(', ');
  return fallback || '';
};

const resolveRecipient = async ({ recipientType, recipientId }) => {
  if (!recipientType || !recipientId) return null;

  if (recipientType === 'account') {
    if (!isObjectId(recipientId)) {
      const error = new Error('Destinatario invalido');
      error.status = 400;
      throw error;
    }
    const account = await getUserAccountById(recipientId);
    if (!account) {
      const error = new Error('Usuario no encontrado');
      error.status = 404;
      throw error;
    }
    return {
      ownerUser: account._id?.toString?.() || recipientId,
      ownerName: normalizeName(account?.profile?.nombre, account?.profile?.apellido, account?.username),
      ownerEmail: account?.profile?.email || '',
      ownerPhone: account?.profile?.telefono || '',
      recipientType
    };
  }

  if (recipientType === 'professional') {
    if (!isObjectId(recipientId)) {
      const error = new Error('Destinatario invalido');
      error.status = 400;
      throw error;
    }
    const professional = await getProfessionalById(recipientId);
    if (!professional) {
      const error = new Error('Profesional no encontrado');
      error.status = 404;
      throw error;
    }
    return {
      ownerUser: professional.userId || null,
      ownerName: normalizeName(professional?.nombre, professional?.apellido, professional?.username),
      ownerEmail: professional?.email || '',
      ownerPhone: professional?.telefono || '',
      recipientType
    };
  }

  const error = new Error('Tipo de destinatario invalido');
  error.status = 400;
  throw error;
};

const buildParticipants = (senderId, recipientId) => {
  const ids = [senderId, recipientId].filter(Boolean);
  return Array.from(new Set(ids));
};

const resolveParticipantContact = async (participantId) => {
  if (!participantId) return null;
  if (isObjectId(participantId)) {
    const account = await getUserAccountById(participantId);
    if (account) {
      return {
        id: participantId,
        email: account?.profile?.email || ''
      };
    }
  }

  const professional = await findByUserId(participantId);
  if (professional) {
    return {
      id: professional.userId || participantId,
      email: professional.email || ''
    };
  }

  return { id: participantId, email: '' };
};

export const buildAccessFilter = (user) => {
  if (isAdminRole(user?.role)) {
    return withNotHidden({}, user?.id);
  }
  if (!user?.id) return { ownerUser: null };
  return withNotHidden({
    $or: [
      { participants: user.id },
      { ownerUser: user.id }
    ]
  }, user?.id);
};

export const buildUnreadFilter = (user) => {
  const access = buildAccessFilter(user);
  if (!user?.id) return access;
  if (!canStoreReadBy(user.id)) return access;
  return withNotHidden({ ...access, readBy: { $nin: [user.id] } }, user?.id);
};

export const listThreadsForUser = (user, { page = 1, limit = 20, unreadOnly = false, status } = {}) => {
  const filter = unreadOnly ? buildUnreadFilter(user) : buildAccessFilter(user);
  if (status) {
    filter.status = status;
  }
  return listThreadsRepo(filter, { page, limit });
};

export const countUnreadForUser = (user) => countThreadsRepo(buildUnreadFilter(user));

export const getThreadForUser = async (id, user) => {
  const thread = await getThreadById(id);
  if (!thread) return null;
  if (user?.id && Array.isArray(thread.hiddenBy) && thread.hiddenBy.includes(user.id)) {
    return null;
  }

  if (isAdminRole(user?.role)) {
    return thread;
  }

  const ownerMatch = thread.ownerUser?.toString?.() === user?.id;
  const participantMatch = Array.isArray(thread.participants) && thread.participants.includes(user?.id);
  if (ownerMatch || participantMatch) {
    return thread;
  }

  return null;
};

export const markThreadRead = async (threadId, userId) => {
  if (!canStoreReadBy(userId)) return null;
  return updateThread(threadId, { $addToSet: { readBy: userId } });
};

export const markThreadUnread = async (threadId, userId) => {
  if (!canStoreReadBy(userId)) return null;
  return markThreadUnreadRepo(threadId, userId);
};

export const hideThreadForUser = async (threadId, userId) => {
  if (!userId) return null;
  return hideThreadForUserRepo(threadId, userId);
};

export const createThreadFromUser = async ({ user, subject, body, recipientType, recipientId }) => {
  const account = user?.id && isObjectId(user.id) ? await getUserAccountById(user.id) : null;
  const author = buildAuthorFromUser(user, account);
  const ownerInfo = buildOwnerInfo(account, {
    name: author.name,
    email: author.email
  });

  const recipient = recipientType && recipientId
    ? await resolveRecipient({ recipientType, recipientId })
    : null;

  if (recipient?.ownerUser && recipient.ownerUser === user?.id) {
    const error = new Error('No puedes enviarte mensajes a ti mismo');
    error.status = 400;
    throw error;
  }

  const safeSubject = sanitizeText(subject, MAX_SUBJECT_LENGTH) || 'Nuevo mensaje';
  const safeBody = sanitizeText(body, MAX_BODY_LENGTH);

  const thread = await createThreadRepo({
    subject: safeSubject,
    category: 'mensaje',
    channel: 'app',
    ownerUser: recipient?.ownerUser || user?.id || null,
    ...(recipient || ownerInfo),
    messages: [
      {
        author,
        body: safeBody
      }
    ],
    readBy: canStoreReadBy(user?.id) ? [user.id] : [],
    participants: buildParticipants(user?.id || null, recipient?.ownerUser || null),
    metadata: recipient ? { recipientType } : undefined
  });

  if (recipient?.ownerUser) {
    if (recipient.ownerEmail) {
      sendInboxNotificationEmail({
        to: recipient.ownerEmail,
        subject: safeSubject,
        threadId: thread._id?.toString?.()
      });
    }
    notifyUser(recipient.ownerUser.toString(), 'notification:new', {
      threadId: thread._id?.toString?.()
    });
  } else {
    const adminRecipients = await getAdminRecipients();
    if (adminRecipients.length) {
      sendInboxNotificationEmail({
        to: adminRecipients,
        subject: safeSubject,
        threadId: thread._id?.toString?.()
      });
    }
    notifyAdmins('notification:new', buildAdminNotificationPayload(thread));
  }

  return thread;
};

export const createThreadFromIdea = async (idea) => {
  const safeSubject = sanitizeText(`Idea: ${idea?.nombre || 'Nueva idea'}`, MAX_SUBJECT_LENGTH);
  const safeBody = sanitizeText(idea?.mensaje || '', MAX_BODY_LENGTH);

  const thread = await createThreadRepo({
    subject: safeSubject || 'Nueva idea',
    category: 'idea',
    channel: 'plataforma',
    ownerName: sanitizeText(idea?.nombre || '', 120),
    ownerEmail: sanitizeText(idea?.email || '', 160),
    messages: [
      {
        author: {
          role: 'lead',
          name: sanitizeText(idea?.nombre || '', 120),
          email: sanitizeText(idea?.email || '', 160)
        },
        body: safeBody
      }
    ],
    readBy: [],
    metadata: {
      rol: sanitizeText(idea?.rol || '', 120),
      impacto: sanitizeText(idea?.impacto || '', 800),
      source: sanitizeText(idea?.source || '', 40)
    }
  });

  const adminRecipients = await getAdminRecipients();
  if (adminRecipients.length) {
    sendInboxNotificationEmail({
      to: adminRecipients,
      subject: thread.subject,
      threadId: thread._id?.toString?.()
    });
  }

  notifyAdmins('notification:new', buildAdminNotificationPayload(thread));

  return thread;
};

export const createThreadFromDemo = async (demo) => {
  const safeSubject = sanitizeText(`Demo: ${demo?.nombre || 'Nueva solicitud'}`, MAX_SUBJECT_LENGTH);
  const safeBody = sanitizeText(demo?.mensaje || '', MAX_BODY_LENGTH);

  const thread = await createThreadRepo({
    subject: safeSubject || 'Nueva solicitud de demo',
    category: 'demo',
    channel: 'landing',
    ownerName: sanitizeText(demo?.nombre || '', 120),
    ownerEmail: sanitizeText(demo?.email || '', 160),
    ownerPhone: sanitizeText(demo?.telefono || '', 40),
    messages: [
      {
        author: {
          role: 'lead',
          name: sanitizeText(demo?.nombre || '', 120),
          email: sanitizeText(demo?.email || '', 160)
        },
        body: safeBody
      }
    ],
    readBy: [],
    metadata: {
      telefono: sanitizeText(demo?.telefono || '', 40),
      centro: sanitizeText(demo?.centro || '', 120),
      intent: sanitizeText(demo?.intent || '', 20),
      source: sanitizeText(demo?.source || '', 40)
    }
  });

  const adminRecipients = await getAdminRecipients();
  if (adminRecipients.length) {
    sendInboxNotificationEmail({
      to: adminRecipients,
      subject: thread.subject,
      threadId: thread._id?.toString?.()
    });
  }

  notifyAdmins('notification:new', buildAdminNotificationPayload(thread));

  return thread;
};

export const replyToThread = async ({ threadId, user, body }) => {
  const thread = await getThreadById(threadId);
  if (!thread) return null;

  const account = user?.id && isObjectId(user.id) ? await getUserAccountById(user.id) : null;
  const author = buildAuthorFromUser(user, account);
  const safeBody = sanitizeText(body, MAX_BODY_LENGTH);

  const updated = await addMessageToThread(threadId, {
    author,
    body: safeBody
  }, canStoreReadBy(user?.id) ? [user.id] : []);

  const participantIds = Array.isArray(updated?.participants) ? updated.participants : [];
  const otherParticipants = participantIds.filter((id) => id && id !== user?.id);

  if (otherParticipants.length) {
    const contacts = await Promise.all(otherParticipants.map(resolveParticipantContact));
    const emails = contacts.map((contact) => contact?.email).filter(Boolean);

    if (emails.length) {
      sendInboxNotificationEmail({
        to: emails,
        subject: updated.subject || 'Nuevo mensaje',
        threadId: updated._id?.toString?.()
      });
    }

    otherParticipants.forEach((participantId) => {
      notifyUser(participantId.toString(), 'notification:new', {
        threadId: updated._id?.toString?.()
      });
    });

    return updated;
  }

  const isAdmin = isAdminRole(user?.role);

  if (isAdmin) {
    if (updated?.ownerEmail) {
      const hasAppUser = Boolean(updated?.ownerUser);
      if (hasAppUser) {
        sendInboxNotificationEmail({
          to: updated.ownerEmail,
          subject: updated.subject || 'Nuevo mensaje',
          threadId: updated._id?.toString?.()
        });
      } else {
        sendThreadReplyEmail({
          to: updated.ownerEmail,
          subject: updated.subject || 'Nuevo mensaje',
          body: safeBody,
          threadId: updated._id?.toString?.()
        });
      }
    }

    notifyAdmins('notification:update', buildAdminNotificationPayload(updated));

    if (updated?.ownerUser) {
      notifyUser(updated.ownerUser.toString(), 'notification:new', {
        threadId: updated._id?.toString?.()
      });
    }
  } else {
    const adminRecipients = await getAdminRecipients();
    if (adminRecipients.length) {
      sendInboxNotificationEmail({
        to: adminRecipients,
        subject: updated.subject || 'Nuevo mensaje',
        threadId: updated._id?.toString?.()
      });
    }
    notifyAdmins('notification:new', buildAdminNotificationPayload(updated));
  }

  return updated;
};

export const createThreadFromAdmin = async ({ user, recipientType, recipientId, subject, body }) => {
  const recipient = await resolveRecipient({ recipientType, recipientId });

  const account = user?.id && isObjectId(user.id) ? await getUserAccountById(user.id) : null;
  const author = buildAuthorFromUser(user, account);

  const safeSubject = sanitizeText(subject, MAX_SUBJECT_LENGTH) || 'Nuevo mensaje';
  const safeBody = sanitizeText(body, MAX_BODY_LENGTH);

  const thread = await createThreadRepo({
    subject: safeSubject,
    category: 'mensaje',
    channel: 'app',
    ownerUser: recipient.ownerUser,
    ownerName: recipient.ownerName,
    ownerEmail: recipient.ownerEmail,
    ownerPhone: recipient.ownerPhone,
    messages: [
      {
        author,
        body: safeBody
      }
    ],
    readBy: canStoreReadBy(user?.id) ? [user.id] : [],
    participants: buildParticipants(user?.id || null, recipient.ownerUser || null),
    metadata: {
      recipientType,
      recipientId
    }
  });

  if (recipient.ownerEmail) {
    sendInboxNotificationEmail({
      to: recipient.ownerEmail,
      subject: thread.subject,
      threadId: thread._id?.toString?.()
    });
  }

  if (recipient.ownerUser) {
    notifyUser(recipient.ownerUser.toString(), 'notification:new', {
      threadId: thread._id?.toString?.()
    });
  }

  return thread;
};

export const listRecipientsForUser = async (user) => {
  const [accounts, professionals] = await Promise.all([
    listUserAccounts(),
    listProfessionalsRepo()
  ]);

  const recipientList = [];
  const currentUserId = user?.id;

  (accounts || []).forEach((account) => {
    const id = account._id?.toString?.() || account.id || null;
    if (!id || id === currentUserId) return;
    const name = normalizeName(account?.profile?.nombre, account?.profile?.apellido, account?.username);
    recipientList.push({
      type: 'account',
      id,
      label: `${name || account.username} (${account.role || 'usuario'})`
    });
  });

  (professionals || []).forEach((professional) => {
    if (!professional) return;
    if (professional.userId && professional.userId === currentUserId) return;
    const name = normalizeName(professional?.nombre, professional?.apellido, professional?.username);
    recipientList.push({
      type: 'professional',
      id: professional._id?.toString?.() || professional.id,
      label: `Prof. ${name || professional.username || professional.userId}`
    });
  });

  return recipientList;
};

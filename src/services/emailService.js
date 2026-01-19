import nodemailer from 'nodemailer';
import { logger } from '../logger/index.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const connectionTimeout = Number(process.env.SMTP_CONNECTION_TIMEOUT || 10000);
  const greetingTimeout = Number(process.env.SMTP_GREETING_TIMEOUT || 10000);
  const socketTimeout = Number(process.env.SMTP_SOCKET_TIMEOUT || 15000);
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout,
    greetingTimeout,
    socketTimeout
  });

  return transporter;
};

const formatLine = (label, value) => `${label}: ${value || '-'}`;

export const sendIdeaEmail = async (idea) => {
  const mailer = getTransporter();
  const to = process.env.MAIL_TO;

  if (!mailer || !to) {
    logger.warn('[mail] Configuracion incompleta para enviar ideas');
    return false;
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const subject = 'Nueva idea desde la plataforma';
  const text = [
    'Se recibio una nueva idea:',
    '',
    formatLine('Nombre', idea?.nombre),
    formatLine('Email', idea?.email),
    formatLine('Rol', idea?.rol),
    '',
    'Idea:',
    idea?.mensaje || '-',
    '',
    'Impacto:',
    idea?.impacto || '-',
    '',
    formatLine('Origen', idea?.source),
    formatLine('IP', idea?.ip),
    formatLine('User-Agent', idea?.userAgent),
    formatLine('Fecha', idea?.createdAt ? new Date(idea.createdAt).toISOString() : '')
  ].join('\n');

  try {
    await mailer.sendMail({
      from,
      to,
      subject,
      text,
      replyTo: idea?.email || undefined
    });
    return true;
  } catch (error) {
    logger.error('[mail] Error al enviar idea:', error);
    return false;
  }
};

const buildThreadUrl = (threadId) => {
  const base = process.env.FRONTEND_URL || '';
  if (!base || !threadId) return null;
  return `${base.replace(/\/$/, '')}/notificaciones?thread=${threadId}`;
};

export const sendInboxNotificationEmail = async ({ to, subject, threadId }) => {
  const mailer = getTransporter();
  if (!mailer || !to) {
    logger.warn('[mail] Configuracion incompleta para notificaciones de inbox');
    return false;
  }

  const recipients = Array.isArray(to) ? to : [to];
  const cleanRecipients = recipients.filter(Boolean);
  if (!cleanRecipients.length) return false;

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const threadUrl = buildThreadUrl(threadId);
  const mailSubject = subject || 'Nuevo mensaje en la app';
  const textLines = [
    'Tenes un nuevo mensaje en la app.',
    '',
    `Asunto: ${mailSubject}`
  ];
  if (threadUrl) {
    textLines.push('', `Abrir: ${threadUrl}`);
  }

  try {
    await mailer.sendMail({
      from,
      to: cleanRecipients,
      subject: `Notificacion: ${mailSubject}`,
      text: textLines.join('\n')
    });
    return true;
  } catch (error) {
    logger.error('[mail] Error al enviar notificacion inbox:', error);
    return false;
  }
};

export const sendThreadReplyEmail = async ({ to, subject, body, threadId }) => {
  const mailer = getTransporter();
  if (!mailer || !to) {
    logger.warn('[mail] Configuracion incompleta para respuestas');
    return false;
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const threadUrl = buildThreadUrl(threadId);
  const safeSubject = subject || 'Nuevo mensaje';
  const textLines = [
    'Recibiste una respuesta desde la app.',
    '',
    `Asunto: ${safeSubject}`,
    '',
    body || '-'
  ];
  if (threadUrl) {
    textLines.push('', `Ver hilo: ${threadUrl}`);
  }

  try {
    await mailer.sendMail({
      from,
      to,
      subject: `Respuesta: ${safeSubject}`,
      text: textLines.join('\n')
    });
    return true;
  } catch (error) {
    logger.error('[mail] Error al enviar respuesta:', error);
    return false;
  }
};

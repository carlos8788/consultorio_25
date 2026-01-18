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
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
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

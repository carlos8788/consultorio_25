import { createIdeaRequest as createIdeaRequestRepo } from '../repositories/ideaRequestRepository.js';

const normalizeValue = (value) => (typeof value === 'string' ? value.trim() : value);

const sanitizeText = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[<>]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim();
};

export const createIdeaRequest = (data = {}) => createIdeaRequestRepo({
  nombre: sanitizeText(normalizeValue(data.nombre)) || '',
  email: normalizeValue(data.email) || '',
  rol: sanitizeText(normalizeValue(data.rol)) || undefined,
  mensaje: sanitizeText(normalizeValue(data.mensaje)) || '',
  impacto: sanitizeText(normalizeValue(data.impacto)) || undefined,
  source: sanitizeText(normalizeValue(data.source)) || 'plataforma',
  ip: normalizeValue(data.ip) || undefined,
  userAgent: sanitizeText(normalizeValue(data.userAgent)) || undefined,
  estado: 'nuevo'
});

import { createDemoRequest as createDemoRequestRepo } from '../repositories/demoRequestRepository.js';

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

export const createDemoRequest = (data = {}) => createDemoRequestRepo({
  nombre: sanitizeText(normalizeValue(data.nombre)) || '',
  email: normalizeValue(data.email) || '',
  telefono: sanitizeText(normalizeValue(data.telefono)) || '',
  ip: normalizeValue(data.ip) || undefined,
  centro: sanitizeText(normalizeValue(data.centro)) || undefined,
  mensaje: sanitizeText(normalizeValue(data.mensaje)) || undefined,
  intent: data.intent || 'demo',
  source: sanitizeText(normalizeValue(data.source)) || 'landing',
  estado: 'nuevo'
});

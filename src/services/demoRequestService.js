import { createDemoRequest as createDemoRequestRepo } from '../repositories/demoRequestRepository.js';

const normalizeValue = (value) => (typeof value === 'string' ? value.trim() : value);

export const createDemoRequest = (data = {}) => createDemoRequestRepo({
  nombre: normalizeValue(data.nombre) || '',
  email: normalizeValue(data.email) || '',
  telefono: normalizeValue(data.telefono) || '',
  ip: normalizeValue(data.ip) || undefined,
  centro: normalizeValue(data.centro) || undefined,
  mensaje: normalizeValue(data.mensaje) || undefined,
  intent: data.intent || 'demo',
  source: normalizeValue(data.source) || 'landing',
  estado: 'nuevo'
});

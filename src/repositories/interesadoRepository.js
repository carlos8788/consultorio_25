import InteresadoNotificacion from '../models/InteresadoNotificacion.js';

export const createInteresado = (data) => new InteresadoNotificacion(data).save();

export const listInteresados = (filter = {}, { limit = 50 } = {}) =>
  InteresadoNotificacion.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('professional', 'nombre apellido')
    .populate('paciente', 'nombre apellido dni telefono')
    .lean();

export const getInteresadoById = (id) =>
  InteresadoNotificacion.findById(id)
    .populate('professional', 'nombre apellido')
    .populate('paciente', 'nombre apellido dni telefono')
    .lean();

export const updateInteresado = (id, data) =>
  InteresadoNotificacion.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('professional', 'nombre apellido')
    .populate('paciente', 'nombre apellido dni telefono')
    .lean();

export const deleteInteresado = (id) => InteresadoNotificacion.findByIdAndDelete(id);

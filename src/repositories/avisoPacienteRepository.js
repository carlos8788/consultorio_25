import AvisoPaciente from '../models/AvisoPaciente.js';

export const createAviso = (data) => new AvisoPaciente(data).save();

export const listAvisos = (filter = {}, { page = 1, limit = 10 } = {}) =>
  AvisoPaciente.paginate(filter, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [
      { path: 'paciente', select: 'nombre apellido dni' },
      { path: 'professional', select: 'nombre apellido userId' }
    ],
    lean: true
  });

export const updateAviso = (filter, data) =>
  AvisoPaciente.findOneAndUpdate(filter, data, { new: true }).populate('paciente', 'nombre apellido dni').lean();

export const deleteAviso = (filter) => AvisoPaciente.findOneAndDelete(filter).lean();

export const findAvisoById = (id) =>
  AvisoPaciente.findById(id).populate('paciente', 'nombre apellido dni').lean();

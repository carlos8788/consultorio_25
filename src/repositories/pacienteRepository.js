import Paciente from '../models/Paciente.js';

const withNotDeleted = (filter = {}) => {
  if (!filter || Object.keys(filter).length === 0) {
    return { deletedAt: null };
  }
  if (filter.$and) {
    return { ...filter, $and: [...filter.$and, { deletedAt: null }] };
  }
  return { $and: [filter, { deletedAt: null }] };
};

export const paginatePacientes = (query, options) =>
  Paciente.paginate(withNotDeleted(query), options);

export const findPaciente = (filter) =>
  Paciente.findOne(withNotDeleted(filter))
    .populate('obraSocial')
    .populate('professional')
    .populate('professionals')
    .lean();

export const findPacienteAny = (filter) =>
  Paciente.findOne(filter).lean();

export const createPaciente = (data) => new Paciente(data).save();

export const updatePaciente = (filter, data) =>
  Paciente.findOneAndUpdate(withNotDeleted(filter), data, { new: true, runValidators: true });

export const updatePacienteAny = (filter, data) =>
  Paciente.findOneAndUpdate(filter, data, { new: true, runValidators: true });

export const deletePaciente = (filter, { force = false, deletedBy = null } = {}) => {
  if (force) {
    return Paciente.findOneAndDelete(filter);
  }
  return Paciente.findOneAndUpdate(
    withNotDeleted(filter),
    { deletedAt: new Date(), deletedBy },
    { new: true }
  );
};

export const addProfessionalReference = (pacienteId, professionalId) =>
  Paciente.findByIdAndUpdate(
    pacienteId,
    { $addToSet: { professionals: professionalId } },
    { new: true }
  );

export const legacyPacienteFilter = { $or: [{ professional: { $exists: false } }, { professional: null }] };

export const assignProfessionalToLegacyPatients = (professionalId) =>
  Paciente.updateMany(
    withNotDeleted(legacyPacienteFilter),
    {
      professional: professionalId,
      $addToSet: { professionals: professionalId }
    }
  );

export const searchPacientes = (query, { limit = 8 } = {}) =>
  Paciente.find(withNotDeleted(query))
    .sort({ apellido: 1, nombre: 1 })
    .limit(limit)
    .populate('obraSocial', 'nombre')
    .lean();

export const countPacientes = (filter = {}) => Paciente.countDocuments(withNotDeleted(filter));

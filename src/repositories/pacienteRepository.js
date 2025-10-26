import Paciente from '../models/Paciente.js';

export const paginatePacientes = (query, options) =>
  Paciente.paginate(query, options);

export const findPaciente = (filter) =>
  Paciente.findOne(filter)
    .populate('obraSocial')
    .populate('doctor')
    .lean();

export const createPaciente = (data) => new Paciente(data).save();

export const updatePaciente = (filter, data) =>
  Paciente.findOneAndUpdate(filter, data, { new: true, runValidators: true });

export const deletePaciente = (filter) =>
  Paciente.findOneAndDelete(filter);

export const legacyPacienteFilter = { $or: [{ doctor: { $exists: false } }, { doctor: null }] };

export const assignDoctorToLegacyPatients = (doctorId) =>
  Paciente.updateMany(legacyPacienteFilter, { doctor: doctorId });

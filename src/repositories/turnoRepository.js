import Turno from '../models/Turno.js';

export const paginateTurnos = (query, options) =>
  Turno.paginate(query, options);

export const findTurno = (filter) =>
  Turno.findOne(filter)
    .populate({
      path: 'paciente',
      populate: {
        path: 'obraSocial'
      }
    })
    .populate('doctor')
    .lean();

export const findTurnoLean = (filter, sort = { fecha: 1, hora: 1 }) =>
  Turno.findOne(filter).sort(sort).lean();

export const createTurno = (data) => new Turno(data).save();

export const updateTurno = (filter, data) =>
  Turno.findOneAndUpdate(filter, data, { new: true, runValidators: true });

export const deleteTurno = (filter) =>
  Turno.findOneAndDelete(filter);

export const legacyTurnoFilter = { $or: [{ doctor: { $exists: false } }, { doctor: null }] };

export const assignDoctorToLegacyTurnos = (doctorId) =>
  Turno.updateMany(legacyTurnoFilter, { doctor: doctorId });

import NotaPaciente from '../models/NotaPaciente.js';

const withNotDeleted = (filter = {}) => {
  if (!filter || Object.keys(filter).length === 0) {
    return { deletedAt: null };
  }
  if (filter.$and) {
    return { ...filter, $and: [...filter.$and, { deletedAt: null }] };
  }
  return { $and: [filter, { deletedAt: null }] };
};

export const createNota = (data) => new NotaPaciente(data).save();

export const listNotas = (filter = {}, { page = 1, limit = 10 } = {}) =>
  NotaPaciente.paginate(withNotDeleted(filter), {
    page,
    limit,
    sort: { pinned: -1, createdAt: -1 },
    populate: [
      { path: 'paciente', select: 'nombre apellido dni telefono' },
      { path: 'professional', select: 'nombre apellido userId' },
      { path: 'sharedWith', select: 'nombre apellido userId' }
    ],
    lean: true
  });

export const findNota = (filter) =>
  NotaPaciente.findOne(withNotDeleted(filter))
    .populate('paciente', 'nombre apellido dni')
    .populate('professional', 'nombre apellido userId')
    .lean();

export const updateNota = (filter, data) =>
  NotaPaciente.findOneAndUpdate(withNotDeleted(filter), data, { new: true, runValidators: true }).lean();

export const deleteNota = (filter, { force = false, deletedBy = null } = {}) => {
  if (force) {
    return NotaPaciente.findOneAndDelete(filter).lean();
  }
  return NotaPaciente.findOneAndUpdate(
    withNotDeleted(filter),
    { deletedAt: new Date(), deletedBy },
    { new: true }
  ).lean();
};

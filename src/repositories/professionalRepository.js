import Professional from '../models/Professional.js';

const withNotDeleted = (filter = {}) => {
  if (!filter || Object.keys(filter).length === 0) {
    return { deletedAt: null };
  }
  if (filter.$and) {
    return { ...filter, $and: [...filter.$and, { deletedAt: null }] };
  }
  return { $and: [filter, { deletedAt: null }] };
};

export const findByUserId = (userId) => Professional.findOne(withNotDeleted({ userId }));

export const findByUserIdWithPassword = (userId) =>
  Professional.findOne(withNotDeleted({ userId })).select('+passwordHash');

export const createProfessional = (data) => Professional.create(data);

export const getProfessionalById = (id) => Professional.findOne(withNotDeleted({ _id: id }));

export const getProfessionalByIdWithPassword = (id) =>
  Professional.findOne(withNotDeleted({ _id: id })).select('+passwordHash');

export const updateProfessionalPassword = (id, passwordHash) =>
  Professional.findOneAndUpdate(
    withNotDeleted({ _id: id }),
    { passwordHash, passwordUpdatedAt: new Date() },
    { new: true }
  );

export const listProfessionals = () =>
  Professional.find(withNotDeleted()).sort({ apellido: 1, nombre: 1 }).lean();

export const updateProfessional = (id, data) =>
  Professional.findOneAndUpdate(
    withNotDeleted({ _id: id }),
    data,
    { new: true, runValidators: true }
  );

export const deleteProfessional = (id, { force = false, deletedBy = null } = {}) => {
  if (force) {
    return Professional.findByIdAndDelete(id);
  }
  return Professional.findOneAndUpdate(
    withNotDeleted({ _id: id }),
    { deletedAt: new Date(), deletedBy },
    { new: true }
  );
};

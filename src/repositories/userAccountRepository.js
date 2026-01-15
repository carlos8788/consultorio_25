import UserAccount from '../models/UserAccount.js';

const withNotDeleted = (filter = {}) => {
  if (!filter || Object.keys(filter).length === 0) {
    return { deletedAt: null };
  }
  if (filter.$and) {
    return { ...filter, $and: [...filter.$and, { deletedAt: null }] };
  }
  return { $and: [filter, { deletedAt: null }] };
};

export const createUserAccount = (data) => UserAccount.create(data);

export const findUserByUsername = (username, { includePassword = false } = {}) => {
  const query = UserAccount.findOne(withNotDeleted({ username }));
  if (includePassword) {
    query.select('+passwordHash');
  }
  return query.lean();
};

export const listUserAccounts = () =>
  UserAccount.find(withNotDeleted())
    .select('-passwordHash')
    .sort({ role: 1, username: 1 })
    .lean();

export const softDeleteUserAccount = (id, deletedBy = null) =>
  UserAccount.findOneAndUpdate(
    withNotDeleted({ _id: id }),
    { deletedAt: new Date(), deletedBy },
    { new: true }
  );

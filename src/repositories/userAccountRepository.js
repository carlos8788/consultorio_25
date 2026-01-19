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

export const listAdminEmails = async () => {
  const admins = await UserAccount.find(withNotDeleted({ role: { $in: ['admin', 'superadmin'] }, active: true }))
    .select('profile.email')
    .lean();
  return admins
    .map((account) => account?.profile?.email)
    .filter((email) => typeof email === 'string' && email.trim().length > 0);
};

export const getUserAccountById = (id, { includePassword = false } = {}) => {
  const query = UserAccount.findOne(withNotDeleted({ _id: id }));
  if (includePassword) {
    query.select('+passwordHash');
  }
  return query.lean();
};

export const updateUserAccountPassword = (id, passwordHash) =>
  UserAccount.findOneAndUpdate(
    withNotDeleted({ _id: id }),
    { passwordHash, passwordUpdatedAt: new Date() },
    { new: true }
  )
    .select('-passwordHash')
    .lean();

export const updateUserAccountProfileFields = (id, profile = {}) => {
  const update = Object.entries(profile).reduce((acc, [key, value]) => {
    acc[`profile.${key}`] = value;
    return acc;
  }, {});

  return UserAccount.findOneAndUpdate(
    withNotDeleted({ _id: id }),
    { $set: update },
    { new: true, runValidators: true }
  )
    .select('-passwordHash')
    .lean();
};

export const softDeleteUserAccount = (id, deletedBy = null) =>
  UserAccount.findOneAndUpdate(
    withNotDeleted({ _id: id }),
    { deletedAt: new Date(), deletedBy },
    { new: true }
  );

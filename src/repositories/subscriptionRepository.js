import Subscription from '../models/Subscription.js';

export const createSubscription = (data) => Subscription.create(data);

export const findActiveSubscriptionByProfessional = (professionalId) => {
  if (!professionalId) return null;
  const now = new Date();
  return Subscription.findOne({
    professional: professionalId,
    status: 'activa',
    $or: [
      { fin: null },
      { fin: { $gte: now } }
    ]
  }).sort({ fin: -1, createdAt: -1 }).lean();
};

export const findActiveSubscriptionsByProfessionals = (professionalIds = []) => {
  if (!Array.isArray(professionalIds) || professionalIds.length === 0) {
    return [];
  }
  const now = new Date();
  return Subscription.find({
    professional: { $in: professionalIds },
    status: 'activa',
    $or: [
      { fin: null },
      { fin: { $gte: now } }
    ]
  }).sort({ fin: -1, createdAt: -1 }).lean();
};

export const findLatestSubscriptionsByProfessionals = (professionalIds = []) => {
  if (!Array.isArray(professionalIds) || professionalIds.length === 0) {
    return [];
  }
  return Subscription.find({
    professional: { $in: professionalIds }
  }).sort({ updatedAt: -1, createdAt: -1 }).lean();
};

export const hasSubscriptionForProfessional = (professionalId) => {
  if (!professionalId) return null;
  return Subscription.exists({ professional: professionalId });
};

export const listSubscriptionsByProfessional = (professionalId) =>
  Subscription.find({ professional: professionalId }).sort({ createdAt: -1 }).lean();

export const updateSubscriptionStatus = (id, status, extra = {}) =>
  Subscription.findByIdAndUpdate(
    id,
    { status, ...extra },
    { new: true }
  );

export const upsertActiveSubscription = async (professionalId, payload = {}) => {
  if (!professionalId) return null;
  const now = new Date();
  const existing = await Subscription.findOne({
    professional: professionalId,
    status: 'activa',
    $or: [
      { fin: null },
      { fin: { $gte: now } }
    ]
  }).sort({ fin: -1, createdAt: -1 });

  if (existing) {
    return Subscription.findByIdAndUpdate(existing._id, payload, { new: true, runValidators: true });
  }

  return Subscription.create({ professional: professionalId, ...payload });
};

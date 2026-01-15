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

export const listSubscriptionsByProfessional = (professionalId) =>
  Subscription.find({ professional: professionalId }).sort({ createdAt: -1 }).lean();

export const updateSubscriptionStatus = (id, status, extra = {}) =>
  Subscription.findByIdAndUpdate(
    id,
    { status, ...extra },
    { new: true }
  );

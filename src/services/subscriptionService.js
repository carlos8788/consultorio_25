import {
  createSubscription as createSubscriptionRepo,
  updateSubscriptionStatus,
  listSubscriptionsByProfessional as listSubscriptionsByProfessionalRepo,
  findActiveSubscriptionByProfessional
} from '../repositories/subscriptionRepository.js';

export const createSubscription = (data) => createSubscriptionRepo(data);

export const setSubscriptionStatus = (id, status, extra) => updateSubscriptionStatus(id, status, extra);

export const getSubscriptionsByProfessional = (professionalId) =>
  listSubscriptionsByProfessionalRepo(professionalId);

export const getActiveSubscription = (professionalId) =>
  findActiveSubscriptionByProfessional(professionalId);

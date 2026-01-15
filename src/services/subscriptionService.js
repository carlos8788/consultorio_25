import {
  createSubscription as createSubscriptionRepo,
  updateSubscriptionStatus,
  listSubscriptionsByProfessional as listSubscriptionsByProfessionalRepo,
  findActiveSubscriptionByProfessional,
  findActiveSubscriptionsByProfessionals,
  findLatestSubscriptionsByProfessionals,
  hasSubscriptionForProfessional as hasSubscriptionForProfessionalRepo,
  upsertActiveSubscription as upsertActiveSubscriptionRepo
} from '../repositories/subscriptionRepository.js';

export const createSubscription = (data) => createSubscriptionRepo(data);

export const setSubscriptionStatus = (id, status, extra) => updateSubscriptionStatus(id, status, extra);

export const getSubscriptionsByProfessional = (professionalId) =>
  listSubscriptionsByProfessionalRepo(professionalId);

export const getActiveSubscription = (professionalId) =>
  findActiveSubscriptionByProfessional(professionalId);

export const getActiveSubscriptionsForProfessionals = (professionalIds = []) =>
  findActiveSubscriptionsByProfessionals(professionalIds);

export const getLatestSubscriptionsForProfessionals = (professionalIds = []) =>
  findLatestSubscriptionsByProfessionals(professionalIds);

export const hasSubscriptionForProfessional = (professionalId) =>
  hasSubscriptionForProfessionalRepo(professionalId);

export const upsertActiveSubscription = (professionalId, payload) =>
  upsertActiveSubscriptionRepo(professionalId, payload);

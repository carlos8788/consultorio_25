import { ensureSystemConfig, updateSystemConfig } from '../repositories/systemConfigRepository.js';

const mergeConfig = (current, updates) => ({
  clinic: {
    ...(current?.clinic || {}),
    ...(updates?.clinic || {})
  },
  notifications: {
    ...(current?.notifications || {}),
    ...(updates?.notifications || {})
  },
  timezone: updates?.timezone ?? current?.timezone
});

export const getSystemConfig = async () => ensureSystemConfig();

export const saveSystemConfig = async (updates = {}) => {
  const current = await ensureSystemConfig();
  const merged = mergeConfig(current, updates);
  return updateSystemConfig(merged);
};

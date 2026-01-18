import SystemConfig from '../models/SystemConfig.js';

export const ensureSystemConfig = () =>
  SystemConfig.findOneAndUpdate(
    { key: 'default' },
    { $setOnInsert: { key: 'default' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

export const updateSystemConfig = (updates = {}) =>
  SystemConfig.findOneAndUpdate(
    { key: 'default' },
    { $set: updates, $setOnInsert: { key: 'default' } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  ).lean();

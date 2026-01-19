import MessageThread from '../models/MessageThread.js';

export const createThread = (data) => new MessageThread(data).save();

export const getThreadById = (id) => MessageThread.findById(id).lean();

export const addMessageToThread = (id, message, readBy = []) =>
  MessageThread.findByIdAndUpdate(
    id,
    {
      $push: { messages: message },
      $set: { readBy },
      $currentDate: { updatedAt: true }
    },
    { new: true }
  ).lean();

export const updateThread = (id, updates) =>
  MessageThread.findByIdAndUpdate(id, updates, { new: true }).lean();

export const markThreadUnread = (id, userId) =>
  MessageThread.findByIdAndUpdate(
    id,
    { $pull: { readBy: userId } },
    { new: true }
  ).lean();

export const hideThreadForUser = (id, userId) =>
  MessageThread.findByIdAndUpdate(
    id,
    { $addToSet: { hiddenBy: userId } },
    { new: true }
  ).lean();

export const listThreads = (filter = {}, { page = 1, limit = 20 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const query = MessageThread.find(filter)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(safeLimit);

  return query.lean();
};

export const countThreads = (filter = {}) => MessageThread.countDocuments(filter);

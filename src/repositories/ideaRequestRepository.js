import IdeaRequest from '../models/IdeaRequest.js';

export const createIdeaRequest = (data) => new IdeaRequest(data).save();

export const countIdeaRequests = (filter = {}) => IdeaRequest.countDocuments(filter);

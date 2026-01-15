import DemoRequest from '../models/DemoRequest.js';

export const createDemoRequest = (data) => new DemoRequest(data).save();

export const countDemoRequests = (filter = {}) => DemoRequest.countDocuments(filter);

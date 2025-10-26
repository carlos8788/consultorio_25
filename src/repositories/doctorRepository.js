import Doctor from '../models/Doctor.js';

export const findByUserId = (userId) => Doctor.findOne({ userId });

export const createDoctor = (data) => Doctor.create(data);

export const getDoctorById = (id) => Doctor.findById(id);

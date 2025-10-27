import Doctor from '../models/Doctor.js';

export const findByUserId = (userId) => Doctor.findOne({ userId });

// username is the userId
export const findByUserIdWithPassword = (userId) =>
  Doctor.findOne({ userId }).select('+passwordHash');

export const createDoctor = (data) => Doctor.create(data);

export const getDoctorById = (id) => Doctor.findById(id);

export const getDoctorByIdWithPassword = (id) =>
  Doctor.findById(id).select('+passwordHash');

export const updateDoctorPassword = (id, passwordHash) =>
  Doctor.findByIdAndUpdate(
    id,
    { passwordHash, passwordUpdatedAt: new Date() },
    { new: true }
  );

export const listDoctors = () =>
  Doctor.find().sort({ apellido: 1, nombre: 1 }).lean();

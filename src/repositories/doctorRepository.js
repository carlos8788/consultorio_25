import Doctor from '../models/Doctor.js';

export const findByUserId = (userId) => Doctor.findOne({ userId });

export const createDoctor = (data) => Doctor.create(data);

export const getDoctorById = (id) => Doctor.findById(id);

export const listDoctors = () =>
  Doctor.find().sort({ apellido: 1, nombre: 1 }).lean();

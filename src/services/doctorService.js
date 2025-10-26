import {
  findByUserId,
  findByUserIdWithPassword,
  createDoctor,
  getDoctorById,
  getDoctorByIdWithPassword,
  listDoctors as listDoctorsRepo,
  updateDoctorPassword
} from '../repositories/doctorRepository.js';
import {
  assignDoctorToLegacyPatients,
  legacyPacienteFilter
} from '../repositories/pacienteRepository.js';
import {
  assignDoctorToLegacyTurnos,
  legacyTurnoFilter
} from '../repositories/turnoRepository.js';
import {
  generateRandomPassword,
  hashPassword,
  verifyPassword
} from '../utils/passwordUtils.js';

export const ensureDoctorForUser = async (userConfig) => {
  if (userConfig.role === 'admin') {
    return null;
  }

  let doctor = await findByUserId(userConfig.id);

  if (!doctor) {
    doctor = await createDoctor({
      userId: userConfig.id,
      nombre: userConfig.profile?.nombre || userConfig.username,
      apellido: userConfig.profile?.apellido || '',
      especialidad: userConfig.profile?.especialidad || 'Clínica General',
      email: userConfig.profile?.email || '',
      telefono: userConfig.profile?.telefono || ''
    });
  }

  return doctor;
};

export const assignLegacyRecordsToDoctor = async (doctorId) => {
  if (!doctorId) return;

  await Promise.all([
    assignDoctorToLegacyPatients(doctorId),
    assignDoctorToLegacyTurnos(doctorId)
  ]);
};

export const getDoctorByIdOrFail = async (doctorId) => {
  if (!doctorId) return null;
  return getDoctorById(doctorId);
};

export const doctorLegacyFilters = {
  pacientes: legacyPacienteFilter,
  turnos: legacyTurnoFilter
};

export const listDoctors = () => listDoctorsRepo();

export const authenticateDoctorCredentials = async (username, password) => {
  if (!username || !password) {
    return null;
  }

  const doctor = await findByUserIdWithPassword(username);
  if (!doctor || !doctor.passwordHash) {
    return null;
  }

  const isValid = await verifyPassword(password, doctor.passwordHash);
  if (!isValid) {
    return null;
  }

  return doctor;
};

export const resetDoctorPasswordService = async (doctorId, options = {}) => {
  if (!doctorId) {
    const error = new Error('Debes indicar el profesional a actualizar');
    error.status = 400;
    throw error;
  }

  const doctor = await getDoctorByIdWithPassword(doctorId);
  if (!doctor) {
    const error = new Error('Profesional no encontrado');
    error.status = 404;
    throw error;
  }

  const plainPassword = options.password || generateRandomPassword(options.length || 12);
  const hashedPassword = await hashPassword(plainPassword);
  const updatedDoctor = await updateDoctorPassword(doctorId, hashedPassword);

  return {
    doctor: updatedDoctor,
    password: plainPassword
  };
};

import {
  findByUserId,
  createDoctor,
  getDoctorById,
  listDoctors as listDoctorsRepo
} from '../repositories/doctorRepository.js';
import {
  assignDoctorToLegacyPatients,
  legacyPacienteFilter
} from '../repositories/pacienteRepository.js';
import {
  assignDoctorToLegacyTurnos,
  legacyTurnoFilter
} from '../repositories/turnoRepository.js';

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

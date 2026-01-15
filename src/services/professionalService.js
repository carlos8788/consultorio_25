import {
  findByUserId,
  findByUserIdWithPassword,
  createProfessional,
  getProfessionalById,
  getProfessionalByIdWithPassword,
  getProfessionalByIdIncludingDeleted,
  listProfessionals as listProfessionalsRepo,
  updateProfessionalPassword,
  updateProfessional as updateProfessionalRepo,
  deleteProfessional as deleteProfessionalRepo,
  restoreProfessional as restoreProfessionalRepo
} from '../repositories/professionalRepository.js';
import {
  assignProfessionalToLegacyPatients,
  legacyPacienteFilter
} from '../repositories/pacienteRepository.js';
import {
  assignProfessionalToLegacyTurnos,
  legacyTurnoFilter
} from '../repositories/turnoRepository.js';
import {
  generateRandomPassword,
  hashPassword,
  verifyPassword
} from '../utils/passwordUtils.js';

export const ensureProfessionalForUser = async (userConfig) => {
  if (userConfig.role === 'admin' || userConfig.role === 'superadmin') {
    return null;
  }

  let professional = await findByUserId(userConfig.id);

  if (!professional) {
    professional = await createProfessional({
      userId: userConfig.id,
      username: userConfig.username,
      nombre: userConfig.profile?.nombre || userConfig.username,
      apellido: userConfig.profile?.apellido || '',
      especialidad: userConfig.profile?.especialidad || 'Clínica General',
      email: userConfig.profile?.email || '',
      telefono: userConfig.profile?.telefono || ''
    });
  }

  return professional;
};

export const assignLegacyRecordsToProfessional = async (professionalId) => {
  if (!professionalId) return;

  await Promise.all([
    assignProfessionalToLegacyPatients(professionalId),
    assignProfessionalToLegacyTurnos(professionalId)
  ]);
};

export const getProfessionalByIdOrFail = async (professionalId) => {
  if (!professionalId) return null;
  return getProfessionalById(professionalId);
};

export const isProfessionalDeleted = async (professionalId) => {
  const professional = await getProfessionalById(professionalId);
  return !professional;
};

export const professionalLegacyFilters = {
  pacientes: legacyPacienteFilter,
  turnos: legacyTurnoFilter
};

export const listProfessionals = (options = {}) => listProfessionalsRepo(options);
export const createProfessionalService = (data) => createProfessional(data);
export const updateProfessionalService = (id, data) => updateProfessionalRepo(id, data);
export const deleteProfessionalService = (id, options = {}) => deleteProfessionalRepo(id, options);
export const restoreProfessionalService = (id) => restoreProfessionalRepo(id);
export const getProfessionalByIdIncludingDeletedOrFail = async (professionalId) => {
  if (!professionalId) return null;
  return getProfessionalByIdIncludingDeleted(professionalId);
};

export const authenticateProfessionalCredentials = async (username, password) => {
  if (!username || !password) {
    return null;
  }

  const professional = await findByUserIdWithPassword(username);
  if (!professional || !professional.passwordHash) {
    return null;
  }

  const isValid = await verifyPassword(password, professional.passwordHash);
  if (!isValid) {
    return null;
  }

  return professional;
};

export const resetProfessionalPasswordService = async (professionalId, options = {}) => {
  if (!professionalId) {
    const error = new Error('Debes indicar el profesional a actualizar');
    error.status = 400;
    throw error;
  }

  const professional = await getProfessionalByIdWithPassword(professionalId);
  if (!professional) {
    const error = new Error('Profesional no encontrado');
    error.status = 404;
    throw error;
  }

  const plainPassword = options.password || generateRandomPassword(options.length || 12);
  const hashedPassword = await hashPassword(plainPassword);
  const updatedProfessional = await updateProfessionalPassword(professionalId, hashedPassword);

  return {
    professional: updatedProfessional,
    password: plainPassword
  };
};

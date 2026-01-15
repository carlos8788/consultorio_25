import {
  createAviso as createAvisoRepo,
  listAvisos as listAvisosRepo,
  updateAviso as updateAvisoRepo,
  deleteAviso as deleteAvisoRepo,
  findAvisoById as findAvisoByIdRepo
} from '../repositories/avisoPacienteRepository.js';

export const listAvisos = async ({ professionalId, page = 1, limit = 10, includeGenericos = true }) => {
  const filter = {};

  if (professionalId) {
    filter.$or = [{ professional: professionalId }];
    if (includeGenericos) {
      filter.$or.push({ professional: null });
    }
  }

  return listAvisosRepo(filter, { page, limit });
};

export const createAviso = async ({
  titulo,
  motivo,
  tipo,
  canal,
  prioridad,
  fechaProgramada,
  pacienteId,
  pacienteNombre,
  professionalId,
  notas,
  tags = [],
  estado,
  telefono
}) => {
  const payload = {
    titulo,
    motivo,
    tipo,
    canal,
    prioridad,
    pacienteNombre,
    notas,
    tags
  };

  if (professionalId) {
    payload.professional = professionalId;
  }

  if (pacienteId) {
    payload.paciente = pacienteId;
  }

  if (fechaProgramada) {
    payload.fechaProgramada = fechaProgramada;
  }

  if (estado) {
    payload.estado = estado;
  }

  if (telefono) {
    payload.telefono = telefono;
  }

  return createAvisoRepo(payload);
};

export const updateAviso = (filter, data) => updateAvisoRepo(filter, data);

export const deleteAviso = (filter) => deleteAvisoRepo(filter);

export const findAvisoById = (id) => findAvisoByIdRepo(id);

import {
  createInteresado as createInteresadoRepo,
  listInteresados as listInteresadosRepo,
  getInteresadoById,
  updateInteresado,
  deleteInteresado
} from '../repositories/interesadoRepository.js';

export const createInteresado = (data) => createInteresadoRepo({
  professional: data.professional || null,
  paciente: data.paciente || null,
  nombre: data.nombre || '',
  apellido: data.apellido || '',
  telefono: data.telefono || '',
  comentario: data.comentario || '',
  origen: data.origen || 'licencia',
  estado: data.estado || 'pendiente'
});

export const listInteresados = ({ professionalId, limit = 50 }) => {
  const filter = {};
  if (professionalId) {
    filter.professional = professionalId;
  }
  return listInteresadosRepo(filter, { limit });
};

export const getInteresado = (id, professionalId) => {
  if (professionalId) {
    return listInteresadosRepo({ _id: id, professional: professionalId }, { limit: 1 })
      .then((items) => items[0] || null);
  }
  return getInteresadoById(id);
};

export const updateInteresadoService = async (id, data, { professionalId } = {}) => {
  if (professionalId) {
    const current = await getInteresado(id, professionalId);
    if (!current) return null;
  }
  return updateInteresado(id, data);
};

export const deleteInteresadoService = async (id, { professionalId } = {}) => {
  if (professionalId) {
    const current = await getInteresado(id, professionalId);
    if (!current) return null;
  }
  return deleteInteresado(id);
};

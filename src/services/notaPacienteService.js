import {
  createNota as createNotaRepo,
  listNotas as listNotasRepo,
  updateNota as updateNotaRepo,
  deleteNota as deleteNotaRepo,
  findNota as findNotaRepo
} from '../repositories/notaPacienteRepository.js';

const buildVisibilityFilter = (professionalId) => {
  if (!professionalId) return {};
  return {
    $or: [
      { professional: professionalId },
      { sharedWith: professionalId }
    ]
  };
};

const normalizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
    .filter(Boolean)
    .slice(0, 15);
};

const normalizeProfessionalList = (list) => {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') return item.trim();
      if (item.toString) return item.toString();
      return null;
    })
    .filter(Boolean);
};

const cleanFilter = ({ _id, professional, patientFilter = null }) => {
  const filters = [{ _id }];
  if (professional) filters.push({ professional });
  if (patientFilter) filters.push(patientFilter);
  return filters.length === 1 ? filters[0] : { $and: filters };
};

export const listNotas = async ({
  pacienteId,
  professionalId,
  page = 1,
  limit = 10,
  q = '',
  tipo = '',
  tags = [],
  pinned
}) => {
  const filters = [];

  const visibility = buildVisibilityFilter(professionalId);
  if (Object.keys(visibility).length) {
    filters.push(visibility);
  }

  if (pacienteId) {
    filters.push({ paciente: pacienteId });
  }

  if (tipo) {
    filters.push({ tipo });
  }

  const normalizedTags = normalizeTags(tags);
  if (normalizedTags.length) {
    filters.push({ tags: { $all: normalizedTags } });
  }

  if (typeof pinned === 'boolean') {
    filters.push({ pinned });
  }

  const searchTerm = String(q || '').trim();
  if (searchTerm) {
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filters.push({ $or: [{ titulo: regex }, { contenido: regex }] });
  }

  const filter = filters.length === 1 ? filters[0] : { $and: filters };

  return listNotasRepo(filter, { page, limit });
};

export const createNota = async ({
  pacienteId,
  professionalId,
  titulo,
  contenido,
  tipo,
  tags = [],
  pinned = false,
  sharedWith = [],
  createdBy
}) => {
  const payload = {
    paciente: pacienteId,
    professional: professionalId,
    titulo,
    contenido,
    tipo,
    pinned: Boolean(pinned),
    sharedWith: normalizeProfessionalList(sharedWith),
    createdBy
  };

  const normalizedTags = normalizeTags(tags);
  if (normalizedTags.length) {
    payload.tags = normalizedTags;
  }

  return createNotaRepo(payload);
};

export const updateNota = async ({
  notaId,
  pacienteId,
  professionalId,
  data = {},
  updatedBy
}) => {
  const updatePayload = { ...data, updatedBy };

  if (Object.prototype.hasOwnProperty.call(data, 'tags')) {
    updatePayload.tags = normalizeTags(data.tags);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'sharedWith')) {
    updatePayload.sharedWith = normalizeProfessionalList(data.sharedWith);
  }

  return updateNotaRepo(
    cleanFilter({
      _id: notaId,
      patientFilter: pacienteId ? { paciente: pacienteId } : null,
      professional: professionalId
    }),
    updatePayload
  );
};

export const deleteNota = async ({
  notaId,
  pacienteId,
  professionalId,
  deletedBy,
  force = false
}) => deleteNotaRepo(
  cleanFilter({
    _id: notaId,
    patientFilter: pacienteId ? { paciente: pacienteId } : null,
    professional: professionalId
  }),
  { force, deletedBy }
);

export const findNota = (filter) => findNotaRepo(filter);

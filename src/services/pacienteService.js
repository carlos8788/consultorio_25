import {
  paginatePacientes,
  findPaciente,
  findPacienteAny,
  createPaciente as createPacienteRepo,
  updatePaciente as updatePacienteRepo,
  updatePacienteAny as updatePacienteAnyRepo,
  deletePaciente as deletePacienteRepo,
  addProfessionalReference,
  searchPacientes as searchPacientesRepo,
  countPacientes
} from '../repositories/pacienteRepository.js';
import { toPacienteListDTO } from '../dtos/pacienteDto.js';
import { logger } from '../logger/index.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizePhone = (value) => String(value || '').replace(/\D+/g, '');

const buildFlexiblePhoneRegex = (value) => {
  const digits = normalizePhone(value);
  if (!digits || digits.length < 6) return null;
  return new RegExp(digits.split('').map((d) => `${d}\\D*`).join(''), 'i');
};

const buildTelefonoCondition = (search) => {
  if (!search) return null;
  const flexible = buildFlexiblePhoneRegex(search);
  if (flexible) {
    return { telefono: flexible };
  }
  return { telefono: new RegExp(escapeRegex(search), 'i') };
};

const buildSearchQuery = (search) => {
  if (!search) return {};
  const regex = new RegExp(escapeRegex(search), 'i');
  const telefonoCondition = buildTelefonoCondition(search);

  const orConditions = [
    { nombre: regex },
    { apellido: regex },
    { dni: regex },
  ];

  if (telefonoCondition) {
    orConditions.push(telefonoCondition);
  }

  return { $or: orConditions };
};

const buildObraSocialFilter = ({ obraSocialId, particularIds = [] } = {}) => {
  if (!obraSocialId) return {};

  if (obraSocialId === 'particular') {
    const orConditions = [{ obraSocial: null }, { obraSocial: { $exists: false } }];
    if (Array.isArray(particularIds) && particularIds.length) {
      orConditions.push({ obraSocial: { $in: particularIds } });
    }
    return { $or: orConditions };
  }

  if (obraSocialId === 'con_cobertura') {
    return { obraSocial: { $ne: null } };
  }

  return { obraSocial: obraSocialId };
};

export const listPacientes = async ({
  search,
  page,
  limit,
  professionalFilter,
  professionalId,
  obraSocialId,
  particularIds
}) => {
  const filters = [];

  const searchFilter = buildSearchQuery(search);
  if (Object.keys(searchFilter).length) {
    filters.push(searchFilter);
  }

  if (professionalFilter && Object.keys(professionalFilter).length) {
    filters.push(professionalFilter);
  }

  const obraFilter = buildObraSocialFilter({ obraSocialId, particularIds });
  if (Object.keys(obraFilter).length) {
    filters.push(obraFilter);
  }

  const query = filters.length === 0
    ? {}
    : filters.length === 1
      ? filters[0]
      : { $and: filters };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { apellido: 1, nombre: 1 },
    populate: ['obraSocial', 'professional', 'professionals'],
    lean: true
  };

  const pacientes = await paginatePacientes(query, options);
  logger.debug('listPacientes query', {
    search,
    obraSocialId,
    professionalFilter,
    query,
    total: pacientes?.totalDocs,
    returned: pacientes?.docs?.length
  });
  return {
    ...pacientes,
    docs: pacientes.docs.map((paciente) => toPacienteListDTO(paciente, { professionalId }))
  };
};

export const getPaciente = (filter) => findPaciente(filter);

export const getPacienteIncludingDeleted = (filter) => findPacienteAny(filter);

export const createPaciente = (data) => createPacienteRepo(data);

export const updatePaciente = (filter, data) => updatePacienteRepo(filter, data);

export const updatePacienteIncludingDeleted = (filter, data) => updatePacienteAnyRepo(filter, data);

export const deletePaciente = (filter, options = {}) => deletePacienteRepo(filter, options);

export const registerProfessionalForPaciente = (pacienteId, professionalId) => {
  if (!pacienteId || !professionalId) {
    return null;
  }
  return addProfessionalReference(pacienteId, professionalId);
};


export const buildProfessionalOwnershipFilter = (professionalId) => ({
  $or: [
    { professional: professionalId },
    { professionals: professionalId },
  ]
});

export const searchPacientes = async ({ term, dni, limit = 8, professionalFilter }) => {
  const searchConditions = [];
  const andConditions = [];

  if (term) {
    const regex = new RegExp(escapeRegex(term), 'i');
    const telefonoCondition = buildTelefonoCondition(term);
    searchConditions.push(
      { apellido: regex },
      { nombre: regex }
    );

    if (telefonoCondition) {
      searchConditions.push(telefonoCondition);
    }
  }

  if (dni) {
    const dniRegex = new RegExp(escapeRegex(dni), 'i');
    searchConditions.push({ dni: dniRegex });
  }

  if (professionalFilter && Object.keys(professionalFilter).length) {
    andConditions.push(professionalFilter);
  }

  if (searchConditions.length) {
    andConditions.push({ $or: searchConditions });
  }

  const query = andConditions.length === 1
    ? andConditions[0]
    : andConditions.length > 1
      ? { $and: andConditions }
      : {};

  return searchPacientesRepo(query, { limit });
};

export const findPacientesByPhones = async ({ phones = [], professionalFilter } = {}) => {
  const rawList = Array.isArray(phones)
    ? phones.map((p) => String(p || '').trim()).filter(Boolean)
    : [];
  const normalizedList = rawList.map((p) => normalizePhone(p)).filter(Boolean);
  const combined = Array.from(new Set([...rawList, ...normalizedList])).filter(Boolean);

  if (!combined.length) return [];

  const buildFlexibleRegex = (digits) => {
    if (!digits) return null;
    // Crea un patrón que permite separadores no numéricos entre los dígitos
    return digits.split('').map((d) => `${d}\\D*`).join('');
  };

  const regexList = combined
    .map((p) => {
      const digits = normalizePhone(p);
      const pattern = buildFlexibleRegex(digits) || p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return pattern ? { telefono: { $regex: pattern, $options: 'i' } } : null;
    })
    .filter(Boolean);

  if (!regexList.length) return [];

  const base = regexList.length === 1 ? regexList[0] : { $or: regexList };
  const query = professionalFilter && Object.keys(professionalFilter).length
    ? { $and: [professionalFilter, base] }
    : base;

  return searchPacientesRepo(query, { limit: Math.max(regexList.length * 3, 10) });
};

export const getPacienteStats = async ({ professionalFilter, particularIds = [] }) => {
  const baseFilter = professionalFilter || {};
  const total = await countPacientes(baseFilter);

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const nuevosMes = await countPacientes({
    ...baseFilter,
    createdAt: { $gte: inicioMes }
  });

  const sinObraSocial = await countPacientes({
    ...baseFilter,
    $or: [
      { obraSocial: null },
      { obraSocial: { $exists: false } },
      ...(Array.isArray(particularIds) && particularIds.length ? [{ obraSocial: { $in: particularIds } }] : [])
    ]
  });

  const conObraSocial = Math.max(total - sinObraSocial, 0);

  return {
    total,
    conObraSocial,
    sinObraSocial,
    nuevosMes
  };
};

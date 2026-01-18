import ObraSocial from '../models/ObraSocial.js';
import {
  listPacientes,
  createPaciente as createPacienteService,
  registerProfessionalForPaciente,
  upsertCoberturaForPaciente as upsertCoberturaForPacienteService,
  buildProfessionalOwnershipFilter,
  getPaciente,
  getPacienteIncludingDeleted,
  updatePaciente as updatePacienteService,
  updatePacienteIncludingDeleted,
  deletePaciente as deletePacienteService,
  getPacienteStats,
  searchPacientes as searchPacientesService
} from '../services/pacienteService.js';
import {
  listNotas as listNotasService,
  createNota as createNotaService,
  updateNota as updateNotaService,
  deleteNota as deleteNotaService
} from '../services/notaPacienteService.js';
import {
  listAvisos as listAvisosService,
  createAviso as createAvisoService,
  updateAviso as updateAvisoService,
  deleteAviso as deleteAvisoService,
  findAvisoById
} from '../services/avisoPacienteService.js';
import { findPacientesByPhones } from '../services/pacienteService.js';
import { getProfessionalByIdOrFail } from '../services/professionalService.js';
import { toPacienteSuggestionDTO } from '../dtos/pacienteDto.js';
import { logger } from '../logger/index.js';
import {
  buildObservacionesArray,
  getObservacionForProfessional,
  mergeObservacionesForProfessional
} from '../utils/pacienteObservaciones.js';
import { normalizePacienteCobertura } from '../utils/pacienteCoberturas.js';

const formatProfessionalName = (professional) => {
  if (!professional) return null;
  const parts = [professional.apellido, professional.nombre].filter(Boolean);
  return parts.length ? parts.join(', ') : professional.userId || null;
};

const buildProfessionalList = (input, primaryProfessionalId) => {
  const professionalIds = new Set();

  const appendProfessional = (value) => {
    if (!value) return;
    professionalIds.add(value.toString());
  };

  if (primaryProfessionalId) {
    appendProfessional(primaryProfessionalId);
  }

  if (Array.isArray(input)) {
    input.forEach(appendProfessional);
  } else if (typeof input === 'string' && input.trim()) {
    input.split(',').map((value) => value.trim()).forEach(appendProfessional);
  }

  return Array.from(professionalIds);
};

const normalizeDni = (value) => String(value || '').trim();

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

const normalizeObraSocialInput = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && !value.trim()) return null;
  return value;
};

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value._id?.toString) return value._id.toString();
    if (value.id?.toString) return value.id.toString();
  }
  if (value.toString) return value.toString();
  return null;
};

const buildCoberturaEntry = (professionalId, obraSocialId) => ({
  professional: professionalId,
  tipo: obraSocialId ? 'obraSocial' : 'particular',
  obraSocial: obraSocialId || null
});

const isPrimaryProfessional = (paciente, professionalId) =>
  toIdString(paciente?.professional) === toIdString(professionalId);

const hasProfessionalLink = (paciente, professionalId) => {
  if (!paciente || !professionalId) return false;
  const target = professionalId.toString();
  const matches = (value) => value?.toString?.() === target;
  if (matches(paciente.professional)) return true;
  if (Array.isArray(paciente.professionals) && paciente.professionals.some(matches)) return true;
  return false;
};

const resolveProfessionalScope = async (req) => {
  const authUser = req.auth?.user || {};
  const isAdmin = authUser.role === 'admin';
  const requestedProfessionalId = req.query?.professionalId || req.body?.professional;
  const professionalId = isAdmin
    ? (requestedProfessionalId || authUser.professionalId || null)
    : authUser.professionalId || null;

  if (!professionalId && !isAdmin) {
    const error = new Error('El token no tiene un profesional asociado');
    error.status = 400;
    throw error;
  }

  if (!professionalId && isAdmin) {
    const error = new Error('Debes indicar un professionalId (query o body) para operar');
    error.status = 400;
    throw error;
  }

  const professional = await getProfessionalByIdOrFail(professionalId);
  if (!professional) {
    const error = new Error('Profesional no encontrado');
    error.status = 404;
    throw error;
  }

  return {
    professionalId,
    professionalName: formatProfessionalName(professional) || authUser.professionalName,
    professionalFilter: buildProfessionalOwnershipFilter(professionalId),
    isAdmin
  };
};

const buildObrasSocialesContext = async () => {
  const obrasSociales = await ObraSocial.find().sort({ nombre: 1 }).lean();
  const particularDoc = obrasSociales.find(
    (o) => typeof o?.nombre === 'string' && o.nombre.toLowerCase() === 'particular'
  );
  return { obrasSociales, particularIds: particularDoc ? [particularDoc._id] : [] };
};

export const listPacientesApiV1 = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', obraSocial = '' } = req.query;
    const scope = await resolveProfessionalScope(req);
    const { particularIds } = await buildObrasSocialesContext();

    const pacientes = await listPacientes({
      search: String(search).trim(),
      page,
      limit,
      professionalFilter: scope.professionalFilter,
      professionalId: scope.professionalId,
      obraSocialId: String(obraSocial).trim(),
      particularIds
    });

    return res.json({
      pacientes: pacientes.docs,
      pagination: {
        total: pacientes.totalDocs,
        limit: pacientes.limit,
        page: pacientes.page,
        totalPages: pacientes.totalPages
      }
    });
  } catch (error) {
    logger.error('Error al listar pacientes (API v1):', error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudieron obtener los pacientes' });
  }
};

export const getPacienteStatsApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    const { particularIds } = await buildObrasSocialesContext();
    const stats = await getPacienteStats({
      professionalFilter: scope.professionalFilter,
      professionalId: scope.professionalId,
      particularIds
    });
    return res.json({ stats });
  } catch (error) {
    logger.error('Error al obtener stats de pacientes (API v1):', error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudieron obtener las estadisticas' });
  }
};

export const createPacienteApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    const {
      nombre,
      apellido,
      dni,
      telefono,
      obraSocial,
      observaciones,
      edad,
      fechaNacimiento,
      professionals
    } = req.body;

    const normalizedDni = normalizeDni(dni);
    const obraSocialId = normalizeObraSocialInput(obraSocial);
    const professionalsList = buildProfessionalList(professionals, scope.professionalId);
    const observacionesList = buildObservacionesArray(observaciones, scope.professionalId);
    const coberturaEntry = buildCoberturaEntry(scope.professionalId, obraSocialId);
    const basePayload = cleanUndefined({
      nombre,
      apellido,
      dni: normalizedDni || undefined,
      telefono,
      obraSocial: obraSocialId,
      observaciones: observacionesList.length ? observacionesList : undefined,
      edad,
      fechaNacimiento
    });

    if (normalizedDni) {
      const existing = await getPacienteIncludingDeleted({ dni: normalizedDni });
      if (existing) {
        const linked = hasProfessionalLink(existing, scope.professionalId);

        if (existing.deletedAt) {
          const restorePayload = cleanUndefined({
            ...basePayload,
            deletedAt: null,
            deletedBy: null,
            professional: existing.professional || scope.professionalId
          });

          await updatePacienteIncludingDeleted({ _id: existing._id }, restorePayload);
          await registerProfessionalForPaciente(existing._id, scope.professionalId);
          await upsertCoberturaForPacienteService(existing._id, scope.professionalId, obraSocialId);

          const restored = await getPaciente({ _id: existing._id });
          return res.status(200).json({
            paciente: toPacienteSuggestionDTO(restored || existing, { professionalId: scope.professionalId }),
            restored: true,
            professionalId: scope.professionalId
          });
        }

        if (!linked) {
          await registerProfessionalForPaciente(existing._id, scope.professionalId);
          if (!existing.professional) {
            await updatePacienteIncludingDeleted(
              { _id: existing._id },
              { professional: scope.professionalId }
            );
          }
        }

        await upsertCoberturaForPacienteService(existing._id, scope.professionalId, obraSocialId);

        const linkedPaciente = await getPaciente({ _id: existing._id });
        return res.status(200).json({
          paciente: toPacienteSuggestionDTO(linkedPaciente || existing, { professionalId: scope.professionalId }),
          alreadyExists: true,
          linked: !linked,
          professionalId: scope.professionalId
        });
      }
    }

    const nuevoPaciente = await createPacienteService({
      ...basePayload,
      professional: scope.professionalId,
      professionals: professionalsList,
      coberturas: [coberturaEntry]
    });

    await registerProfessionalForPaciente(nuevoPaciente._id, scope.professionalId);

    return res.status(201).json({
      paciente: toPacienteSuggestionDTO(nuevoPaciente, { professionalId: scope.professionalId }),
      professionalId: scope.professionalId
    });
  } catch (error) {
    logger.error('Error al crear paciente (API v1):', error);
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'El DNI ya existe' });
    }
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudo crear el paciente' });
  }
};

const toPacienteApiDTO = (paciente, professionalId) => {
  const normalized = normalizePacienteCobertura(paciente, professionalId);
  return {
    id: normalized?._id?.toString() || normalized?.id || null,
    nombre: normalized?.nombre || '',
    apellido: normalized?.apellido || '',
    dni: normalized?.dni || '',
    telefono: normalized?.telefono || '',
    fechaNacimiento: normalized?.fechaNacimiento || '',
    obraSocial: normalized?.obraSocial
      ? {
          id: normalized.obraSocial?._id?.toString() || null,
          nombre: normalized.obraSocial?.nombre || ''
        }
      : null,
    observaciones: getObservacionForProfessional(normalized, professionalId),
    professional: normalized?.professional || null,
    professionals: normalized?.professionals || []
  };
};

const toAvisoApiDTO = (aviso) => ({
  id: aviso?._id?.toString() || null,
  titulo: aviso?.titulo || '',
  motivo: aviso?.motivo || '',
  canal: aviso?.canal || 'sin_definir',
  prioridad: aviso?.prioridad || 'media',
  tipo: aviso?.tipo || 'general',
  estado: aviso?.estado || 'pendiente',
  fechaProgramada: aviso?.fechaProgramada ? aviso.fechaProgramada.toISOString() : null,
  createdAt: aviso?.createdAt ? aviso.createdAt.toISOString() : null,
  telefono: aviso?.telefono || null,
  paciente: aviso?.paciente
    ? {
        id: aviso.paciente?._id?.toString() || null,
        nombre: aviso.paciente?.nombre || '',
        apellido: aviso.paciente?.apellido || '',
        dni: aviso.paciente?.dni || ''
      }
    : null,
  pacienteNombre: aviso?.pacienteNombre || null
});

const buildPacienteRef = (paciente) => {
  if (!paciente) return null;
  const id = paciente?._id?.toString?.() || paciente?.id || paciente?.toString?.() || null;
  const nombre = paciente?.nombre || '';
  const apellido = paciente?.apellido || '';
  const dni = paciente?.dni || '';
  const telefono = paciente?.telefono || '';
  const labelParts = [apellido, nombre].filter(Boolean);
  const label = labelParts.length
    ? labelParts.join(', ')
    : telefono || dni || id || '';
  return {
    id,
    nombre,
    apellido,
    dni,
    telefono,
    label
  };
};

const toNotaApiDTO = (nota) => {
  const pacienteRef = buildPacienteRef(nota?.paciente);
  return {
    id: nota?._id?.toString() || null,
    paciente: pacienteRef,
    professional: nota?.professional?._id?.toString?.() || nota?.professional?.toString?.() || null,
    titulo: nota?.titulo || '',
    contenido: nota?.contenido || '',
    tipo: nota?.tipo || 'general',
    tags: Array.isArray(nota?.tags) ? nota.tags : [],
    pinned: Boolean(nota?.pinned),
    sharedWith: Array.isArray(nota?.sharedWith)
      ? nota.sharedWith.map((p) => p?._id?.toString?.() || p?.toString?.() || null).filter(Boolean)
      : [],
    createdAt: nota?.createdAt ? new Date(nota.createdAt).toISOString() : null,
    updatedAt: nota?.updatedAt ? new Date(nota.updatedAt).toISOString() : null,
    pacienteLabel: pacienteRef?.label || null
  };
};

const normalizePhone = (value) => String(value || '').replace(/\D+/g, '');
const isPhoneCandidate = (value) => {
  const norm = normalizePhone(value);
  return norm.length >= 6 ? norm : null;
};

const attachPacienteByPhone = async (avisos = [], professionalFilter = {}) => {
  if (!Array.isArray(avisos) || !avisos.length) return avisos;

  // Construir lista de teléfonos a buscar (desde campo telefono o pacienteNombre numérico)
  const phoneCandidates = new Set();
  avisos.forEach((aviso) => {
    if (aviso?.paciente) return;
    const direct = isPhoneCandidate(aviso?.telefono);
    if (direct) phoneCandidates.add(direct);
    if (!direct && aviso?.pacienteNombre) {
      const maybe = isPhoneCandidate(aviso.pacienteNombre);
      if (maybe) phoneCandidates.add(maybe);
    }
  });

  const phoneList = Array.from(phoneCandidates);
  if (!phoneList.length) return avisos;

  const buildMap = async (phones, filter) => {
    const matches = await findPacientesByPhones({ phones, professionalFilter: filter });
    const map = new Map();
    matches.forEach((p) => {
      const key = normalizePhone(p.telefono);
      if (!key || map.has(key)) return;
      map.set(key, p);
    });
    return map;
  };

  // Primero, buscar respetando contexto profesional
  const primaryMap = await buildMap(phoneList, professionalFilter);
  const resolvePaciente = (phone) => primaryMap.get(phone) || null;

  avisos.forEach((aviso) => {
    if (aviso?.paciente) return;
    const phone =
      isPhoneCandidate(aviso?.telefono) ||
      isPhoneCandidate(aviso?.pacienteNombre);
    if (!phone) return;
    const match = resolvePaciente(phone);
    if (match) {
      aviso.paciente = {
        _id: match._id,
        nombre: match.nombre,
        apellido: match.apellido,
        dni: match.dni
      };
      // Si no había pacienteNombre, usar el del match
      if (!aviso.pacienteNombre) {
        const label = [match.apellido, match.nombre].filter(Boolean).join(', ');
        const fallback = match.telefono || aviso.telefono || null;
        aviso.pacienteNombre = label || match.nombre || match.apellido || fallback;
      }
    }
  });

  return avisos;
};

const parsePinnedFlag = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'si'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
  }
  return undefined;
};

const cleanUndefined = (payload = {}) =>
  Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));

export const getPacienteApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    const { id } = req.params;
    const paciente = await getPaciente({ _id: id, ...scope.professionalFilter });
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    return res.json({ paciente: toPacienteApiDTO(paciente, scope.professionalId) });
  } catch (error) {
    logger.error('Error al obtener paciente (API v1):', error);
    return res.status(500).json({ error: 'No se pudo obtener el paciente' });
  }
};

export const searchPacientesApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    const term = String(req.query?.term || '').trim();
    const dni = String(req.query?.dni || '').trim();
    const limit = Math.min(parseInt(req.query?.limit, 10) || 8, 50);

    const pacientes = await searchPacientesService({
      term,
      dni,
      limit,
      professionalFilter: scope.professionalFilter
    });

    return res.json({ pacientes: pacientes.map((paciente) => toPacienteApiDTO(paciente, scope.professionalId)) });
  } catch (error) {
    logger.error('Error al buscar pacientes (API v1):', error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudieron buscar pacientes' });
  }
};

export const listRecentAvisosApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    const limit = Math.min(parseInt(req.query?.limit, 10) || 5, 50);

    const paginated = await listAvisosService({
      professionalId: scope.professionalId,
      page: 1,
      limit,
      includeGenericos: true
    });

    const docs = paginated?.docs || paginated || [];
    const enriched = await attachPacienteByPhone(docs, scope.professionalFilter);

    return res.json({ avisos: (enriched || []).map(toAvisoApiDTO) });
  } catch (error) {
    logger.error('Error al listar avisos recientes (API v1):', error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudieron obtener los avisos' });
  }
};

export const listAvisosApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    const limit = Math.min(parseInt(req.query?.limit, 10) || 10, 200);
    const page = Math.max(parseInt(req.query?.page, 10) || 1, 1);
    const includeGenericos = req.query?.includeGenericos !== 'false';

    const paginated = await listAvisosService({
      professionalId: scope.professionalId,
      page,
      limit,
      includeGenericos
    });

    const docs = paginated?.docs || paginated || [];
    const enriched = await attachPacienteByPhone(docs, scope.professionalFilter);

    return res.json({
      avisos: (enriched || []).map(toAvisoApiDTO),
      pagination: {
        total: paginated?.totalDocs ?? docs.length,
        totalPages: paginated?.totalPages ?? 1,
        page: paginated?.page ?? page,
        limit: paginated?.limit ?? limit
      }
    });
  } catch (error) {
    logger.error('Error al listar avisos (API v1):', error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudieron obtener los avisos' });
  }
};

export const createAvisoApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    const {
      titulo,
      motivo,
      tipo = 'general',
      canal = 'sin_definir',
      prioridad = 'media',
      fechaProgramada,
      pacienteId,
      pacienteNombre,
      notas,
      tags,
      estado = 'pendiente',
      telefono
    } = req.body || {};

    if (!titulo || !String(titulo).trim()) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }

    const aviso = await createAvisoService({
      titulo: String(titulo).trim(),
      motivo,
      tipo,
      canal,
      prioridad,
      fechaProgramada: fechaProgramada || null,
      pacienteId: pacienteId || null,
      pacienteNombre,
      professionalId: scope.professionalId,
      notas,
      tags: Array.isArray(tags) ? tags : [],
      estado,
      telefono
    });

    const stored = await findAvisoById(aviso._id) || aviso;

    return res.status(201).json({ aviso: toAvisoApiDTO(stored) });
  } catch (error) {
    logger.error('Error al crear aviso (API v1):', error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudo crear el aviso' });
  }
};

export const updateAvisoApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    const { id } = req.params;
    const {
      titulo,
      motivo,
      tipo,
      canal,
      prioridad,
      fechaProgramada,
      pacienteId,
      pacienteNombre,
      notas,
      tags,
      estado,
      telefono
    } = req.body || {};

    const filter = {
      _id: id,
      ...scope.professionalFilter
    };

    const updatePayload = {
      titulo,
      motivo,
      tipo,
      canal,
      prioridad,
      fechaProgramada: fechaProgramada || null,
      paciente: pacienteId || null,
      pacienteNombre,
      notas,
      tags: Array.isArray(tags) ? tags : [],
      estado,
      telefono
    };

    const updated = await updateAvisoService(filter, updatePayload);

    if (!updated) {
      return res.status(404).json({ error: 'Aviso no encontrado' });
    }

    return res.json({ aviso: toAvisoApiDTO(updated) });
  } catch (error) {
    logger.error('Error al actualizar aviso (API v1):', error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudo actualizar el aviso' });
  }
};

export const deleteAvisoApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    const { id } = req.params;

    const deleted = await deleteAvisoService({
      _id: id,
      ...scope.professionalFilter
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Aviso no encontrado' });
    }

    return res.json({ success: true });
  } catch (error) {
    logger.error('Error al eliminar aviso (API v1):', error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudo eliminar el aviso' });
  }
};

export const listNotasApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    const { id: pacienteId } = req.params;

    const paciente = await getPaciente({ _id: pacienteId, ...scope.professionalFilter });
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const limit = Math.min(parseInt(req.query?.limit, 10) || 10, 100);
    const page = Math.max(parseInt(req.query?.page, 10) || 1, 1);
    const tags = Array.isArray(req.query?.tags)
      ? req.query.tags
      : typeof req.query?.tags === 'string'
        ? req.query.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
    const pinned = parsePinnedFlag(req.query?.pinned);

    const notas = await listNotasService({
      pacienteId,
      professionalId: scope.professionalId,
      page,
      limit,
      q: String(req.query?.q || '').trim(),
      tipo: String(req.query?.tipo || '').trim(),
      tags,
      pinned
    });

    const docs = notas?.docs || [];
    return res.json({
      notas: docs.map(toNotaApiDTO),
      pagination: {
        total: notas?.totalDocs ?? docs.length,
        totalPages: notas?.totalPages ?? 1,
        page: notas?.page ?? page,
        limit: notas?.limit ?? limit
      }
    });
  } catch (error) {
    logger.error('Error al listar notas de paciente (API v1):', error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudieron obtener las notas' });
  }
};

export const createNotaApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    const { id: pacienteId } = req.params;

    const paciente = await getPaciente({ _id: pacienteId, ...scope.professionalFilter });
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const { titulo, contenido, tipo, tags, pinned, sharedWith } = req.body || {};
    const createdBy = req.auth?.user?.id || req.context?.user?.id || null;
    const pinnedFlag = parsePinnedFlag(pinned);

    const nota = await createNotaService({
      pacienteId,
      professionalId: scope.professionalId,
      titulo,
      contenido,
      tipo,
      tags,
      pinned: pinnedFlag,
      sharedWith,
      createdBy
    });

    return res.status(201).json({ nota: toNotaApiDTO(nota) });
  } catch (error) {
    logger.error('Error al crear nota de paciente (API v1):', error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudo crear la nota' });
  }
};

export const updateNotaApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    const { id: pacienteId, notaId } = req.params;

    const paciente = await getPaciente({ _id: pacienteId, ...scope.professionalFilter });
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const { titulo, contenido, tipo, tags, pinned, sharedWith } = req.body || {};
    const updatedBy = req.auth?.user?.id || req.context?.user?.id || null;
    const pinnedFlag = parsePinnedFlag(pinned);

    const updated = await updateNotaService({
      notaId,
      pacienteId,
      professionalId: scope.professionalId,
      updatedBy,
      data: cleanUndefined({
        titulo,
        contenido,
        tipo,
        tags,
        pinned: pinnedFlag,
        sharedWith
      })
    });

    if (!updated) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }

    return res.json({ nota: toNotaApiDTO(updated) });
  } catch (error) {
    logger.error('Error al actualizar nota de paciente (API v1):', error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudo actualizar la nota' });
  }
};

export const deleteNotaApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    const { id: pacienteId, notaId } = req.params;

    const paciente = await getPaciente({ _id: pacienteId, ...scope.professionalFilter });
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const deletedBy = req.auth?.user?.id || req.context?.user?.id || null;
    const deleted = await deleteNotaService({
      notaId,
      pacienteId,
      professionalId: scope.professionalId,
      deletedBy
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }

    return res.json({ success: true });
  } catch (error) {
    logger.error('Error al eliminar nota de paciente (API v1):', error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudo eliminar la nota' });
  }
};

// --- Notas generales (opcionales con paciente) ---
export const listNotasGeneralApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    if (!scope.professionalId) {
      return res.status(400).json({ error: 'Debes indicar un professionalId' });
    }

    const pacienteId = req.query?.pacienteId || null;
    if (pacienteId) {
      const paciente = await getPaciente({ _id: pacienteId, ...scope.professionalFilter });
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }
    }

    const limit = Math.min(parseInt(req.query?.limit, 10) || 10, 100);
    const page = Math.max(parseInt(req.query?.page, 10) || 1, 1);
    const tags = Array.isArray(req.query?.tags)
      ? req.query.tags
      : typeof req.query?.tags === 'string'
        ? req.query.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
    const pinned = parsePinnedFlag(req.query?.pinned);

    const notas = await listNotasService({
      pacienteId,
      professionalId: scope.professionalId,
      page,
      limit,
      q: String(req.query?.q || '').trim(),
      tipo: String(req.query?.tipo || '').trim(),
      tags,
      pinned
    });

    const docs = notas?.docs || [];
    return res.json({
      notas: docs.map(toNotaApiDTO),
      pagination: {
        total: notas?.totalDocs ?? docs.length,
        totalPages: notas?.totalPages ?? 1,
        page: notas?.page ?? page,
        limit: notas?.limit ?? limit
      }
    });
  } catch (error) {
    logger.error('Error al listar notas (API v1):', error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudieron obtener las notas' });
  }
};

export const createNotaGeneralApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    if (!scope.professionalId) {
      return res.status(400).json({ error: 'Debes indicar un professionalId' });
    }

    const pacienteId = req.body?.pacienteId || null;
    if (pacienteId) {
      const paciente = await getPaciente({ _id: pacienteId, ...scope.professionalFilter });
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }
    }

    const { titulo, contenido, tipo, tags, pinned, sharedWith } = req.body || {};
    const createdBy = req.auth?.user?.id || req.context?.user?.id || null;
    const pinnedFlag = parsePinnedFlag(pinned);

    const nota = await createNotaService({
      pacienteId,
      professionalId: scope.professionalId,
      titulo,
      contenido,
      tipo,
      tags,
      pinned: pinnedFlag,
      sharedWith,
      createdBy
    });

    return res.status(201).json({ nota: toNotaApiDTO(nota) });
  } catch (error) {
    logger.error('Error al crear nota (API v1):', error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudo crear la nota' });
  }
};

export const updateNotaGeneralApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    if (!scope.professionalId) {
      return res.status(400).json({ error: 'Debes indicar un professionalId' });
    }

    const { notaId } = req.params;
    const pacienteId = req.body?.pacienteId || null;

    if (pacienteId) {
      const paciente = await getPaciente({ _id: pacienteId, ...scope.professionalFilter });
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }
    }

    const { titulo, contenido, tipo, tags, pinned, sharedWith } = req.body || {};
    const updatedBy = req.auth?.user?.id || req.context?.user?.id || null;
    const pinnedFlag = parsePinnedFlag(pinned);

    const updated = await updateNotaService({
      notaId,
      pacienteId,
      professionalId: scope.professionalId,
      updatedBy,
      data: cleanUndefined({
        titulo,
        contenido,
        tipo,
        tags,
        pinned: pinnedFlag,
        sharedWith
      })
    });

    if (!updated) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }

    return res.json({ nota: toNotaApiDTO(updated) });
  } catch (error) {
    logger.error('Error al actualizar nota (API v1):', error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudo actualizar la nota' });
  }
};

export const deleteNotaGeneralApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    if (!scope.professionalId) {
      return res.status(400).json({ error: 'Debes indicar un professionalId' });
    }

    const { notaId } = req.params;
    const pacienteId = req.query?.pacienteId || null;

    if (pacienteId) {
      const paciente = await getPaciente({ _id: pacienteId, ...scope.professionalFilter });
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }
    }

    const deletedBy = req.auth?.user?.id || req.context?.user?.id || null;
    const deleted = await deleteNotaService({
      notaId,
      pacienteId,
      professionalId: scope.professionalId,
      deletedBy
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }

    return res.json({ success: true });
  } catch (error) {
    logger.error('Error al eliminar nota (API v1):', error);
    const status = error.status || 500;
    return res.status(status).json({ error: error.message || 'No se pudo eliminar la nota' });
  }
};

export const updatePacienteApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    const { id } = req.params;
    const {
      nombre,
      apellido,
      dni,
      telefono,
      obraSocial,
      observaciones,
      edad,
      fechaNacimiento,
      professionals
    } = req.body;

    const paciente = await getPaciente({ _id: id, ...scope.professionalFilter });
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const hasObraSocialField = hasOwn(req.body, 'obraSocial');
    const obraSocialId = normalizeObraSocialInput(obraSocial);
    const mergedObservaciones = mergeObservacionesForProfessional(
      paciente.observaciones,
      observaciones,
      scope.professionalId
    );

    const updatePayload = {
      nombre,
      apellido,
      dni,
      telefono,
      edad,
      fechaNacimiento
    };

    if (mergedObservaciones !== undefined) {
      updatePayload.observaciones = mergedObservaciones;
    }

    if (professionals) {
      updatePayload.professionals = buildProfessionalList(professionals, scope.professionalId);
    }

    if (hasObraSocialField && isPrimaryProfessional(paciente, scope.professionalId)) {
      updatePayload.obraSocial = obraSocialId;
    }

    const updated = await updatePacienteService(
      { _id: id, ...scope.professionalFilter },
      updatePayload
    );

    if (!updated) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    let responsePaciente = updated;
    if (hasObraSocialField) {
      await upsertCoberturaForPacienteService(paciente._id, scope.professionalId, obraSocialId);
      const refreshed = await getPaciente({ _id: id, ...scope.professionalFilter });
      if (refreshed) {
        responsePaciente = refreshed;
      }
    }

    return res.json({ paciente: toPacienteApiDTO(responsePaciente, scope.professionalId) });
  } catch (error) {
    logger.error('Error al actualizar paciente (API v1):', error);
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'El DNI ya existe' });
    }
    return res.status(500).json({ error: 'No se pudo actualizar el paciente' });
  }
};

export const deletePacienteApiV1 = async (req, res) => {
  try {
    const scope = await resolveProfessionalScope(req);
    const { id } = req.params;
    const userRole = req.auth?.user?.role || req.context?.user?.role || null;
    const force = userRole === 'superadmin';
    const deletedBy = req.auth?.user?.id || req.context?.user?.id || null;

    const deleted = await deletePacienteService(
      { _id: id, ...scope.professionalFilter },
      { force, deletedBy }
    );

    if (!deleted) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    return res.json({ success: true, softDeleted: !force });
  } catch (error) {
    logger.error('Error al eliminar paciente (API v1):', error);
    return res.status(500).json({ error: 'No se pudo eliminar el paciente' });
  }
};

import {
  listTurnos,
  getTurno,
  createTurno as createTurnoService,
  updateTurno as updateTurnoService,
  deleteTurno as deleteTurnoService,
  getFechasDisponibles,
  createManyTurnos as createManyTurnosService,
  turnoHelpers
} from '../services/turnoService.js';
import { registerProfessionalForPaciente } from '../services/pacienteService.js';
import { buildPaginationData } from '../utils/pagination.js';
import {
  getScopedProfessionalId,
  isAdmin,
  persistAdminProfessionalSelection,
  requireProfessionalId,
  resolveProfessionalScope
} from '../utils/turnoScope.js';
import { toTurnoListDTO } from '../dtos/turnoDto.js';
import { logger } from '../logger/index.js';

const normalizePacienteInput = (paciente) => {
  if (paciente === undefined || paciente === null || paciente === '') return null;
  return paciente;
};

const buildTurnoPayload = ({ paciente, fecha, hora, observacionesTurno, diagnostico, estado }) => {
  const payload = {};

  if (fecha !== undefined) payload.fecha = fecha;
  if (hora !== undefined) payload.hora = hora;
  if (observacionesTurno !== undefined) payload.observacionesTurno = observacionesTurno;
  if (diagnostico !== undefined) payload.diagnostico = diagnostico;
  if (estado !== undefined) payload.estado = estado;
  if (paciente !== undefined) {
    payload.paciente = normalizePacienteInput(paciente);
  }

  return payload;
};

const handleScopeGuard = (professionalScope, res) => {
  if (professionalScope.requiresSelection) {
    res.status(400).json({
      error: 'Debes seleccionar un profesional para continuar',
      requiresProfessionalSelection: true
    });
    return true;
  }

  if (professionalScope.invalidProfessional) {
    res.status(404).json({ error: 'Profesional no encontrado' });
    return true;
  }

  return false;
};

const parseShowAllFlag = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

export const getTurnosApi = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const fechaParam = typeof req.query.fecha === 'string' ? req.query.fecha : '';
    const pacienteId = typeof req.query.pacienteId === 'string'
      ? req.query.pacienteId
      : (typeof req.query.paciente === 'string' ? req.query.paciente : '');
    const showAll = parseShowAllFlag(req.query.showAll);
    const professionalScope = await resolveProfessionalScope(req);

    if (handleScopeGuard(professionalScope, res)) {
      return;
    }

    const professionalFilter = professionalScope.professionalFilter;
    const turnosFilter = pacienteId
      ? { ...(professionalFilter || {}), paciente: pacienteId }
      : (professionalFilter || {});

    const fechaISOParam = turnoHelpers.normalizeFechaISO(fechaParam) || '';
    const {
      fechasDisponibles: fechasDisponiblesRaw,
      fechasPasadas: fechasPasadasRaw,
      fechasFuturas: fechasFuturasRaw,
      fechasTodas: fechasTodasRaw
    } = await getFechasDisponibles(turnosFilter || {}, fechaISOParam);
    const hoy = new Date().toISOString().split('T')[0];

    let fechaISO = showAll ? '' : fechaISOParam;
    let fechasDisponibles = [...(fechasDisponiblesRaw || [])];
    let fechasPasadas = [...(fechasPasadasRaw || [])];
    let fechasFuturas = [...(fechasFuturasRaw || [])];
    let fechasTodas = [...(fechasTodasRaw || [])];

    const pickCercana = () => {
      const futuraMasCercana = fechasDisponibles.find((f) => f >= hoy) || '';
      const pasadaMasCercana = [...fechasDisponibles].filter((f) => f < hoy).pop() || '';
      return futuraMasCercana || pasadaMasCercana || '';
    };

    if (!showAll && !fechaISO) {
      fechaISO = pickCercana();
    }

    const turnos = await listTurnos({
      page,
      limit,
      fecha: fechaISO,
      professionalFilter: turnosFilter
    });

    // Si por alguna razａn no se obtuvieron fechas disponibles (p.e. datos legacy),
    // usar las fechas presentes en los turnos listados para poblar el select.
    if (!fechasDisponibles.length) {
      const fechasDeTurnos = Array.from(new Set((turnos.docs || []).map((t) => turnoHelpers.normalizeFechaISO(t.fecha)).filter(Boolean))).sort((a, b) => a.localeCompare(b));
      fechasDisponibles = fechasDeTurnos;
      fechasTodas = fechasDeTurnos;
      const pasadas = fechasDeTurnos.filter((f) => f < hoy);
      fechasPasadas = pasadas.slice(Math.max(0, pasadas.length - 4));
      fechasFuturas = fechasDeTurnos.filter((f) => f >= hoy);
      if (!showAll && !fechaISO) {
        fechaISO = pickCercana();
      }
    }

    const fechaActualDisplay = fechaISO ? turnoHelpers.formatFechaCorta(fechaISO) : '';
    const queryParams = {
      ...req.query,
      ...(fechaISO ? { fecha: fechaISO } : {})
    };
    const paginationData = buildPaginationData(
      turnos,
      {
        ...queryParams,
        ...(professionalScope.professionalId ? { professionalId: professionalScope.professionalId } : {})
      }
    );
    console.log('[turnos][api] Fechas calculadas', {
      fechasDisponibles,
      fechasPasadas,
      fechasFuturas,
      fechasTodas
    });
    res.json({
      professionalId: professionalScope.professionalId,
      professionalName: professionalScope.professionalName,
      fechaActual: fechaISO,
      fechaActualDisplay,
      showAll,
      turnosLibres: turnos.turnosLibres,
      turnos: turnos.docs,
      fechasDisponibles,
      fechasPasadas,
      fechasFuturas,
      fechasTodas,
      ...paginationData
    });
  } catch (error) {
    logger.error('Error al obtener turnos (API):', error);
    res.status(500).json({ error: 'Error al obtener turnos' });
  }
};

export const createTurnoApi = async (req, res) => {
  try {
    const { paciente, fecha, hora, observacionesTurno, diagnostico, estado } = req.body;
    const professionalId = isAdmin(req)
      ? (req.body.professional || getScopedProfessionalId(req))
      : requireProfessionalId(req);

    if (!professionalId) {
      return res.status(400).json({ error: 'Debes seleccionar un profesional para crear turnos' });
    }

    persistAdminProfessionalSelection(req, professionalId);

    const turnoData = buildTurnoPayload({ paciente, fecha, hora, observacionesTurno, diagnostico, estado });
    const created = await createTurnoService({
      ...turnoData,
      professional: professionalId
    });

    const pacienteId = normalizePacienteInput(paciente);
    if (pacienteId) {
      await registerProfessionalForPaciente(pacienteId, professionalId);
    }

    const turno = await getTurno({ _id: created._id, professional: professionalId });
    const dto = turno ? toTurnoListDTO(turno) : null;

    res.status(201).json({
      turno: dto,
      professionalId,
      professionalName: req.context?.professionalName || null
    });
  } catch (error) {
    logger.error('Error al crear turno (API):', error);
    res.status(500).json({ error: error.message || 'Error al crear turno' });
  }
};

export const updateTurnoApi = async (req, res) => {
  try {
    const { id } = req.params;
    const { paciente, fecha, hora, observacionesTurno, diagnostico, estado } = req.body;
    const professionalScope = await resolveProfessionalScope(req);

    if (handleScopeGuard(professionalScope, res)) {
      return;
    }

    const turnoData = buildTurnoPayload({ paciente, fecha, hora, observacionesTurno, diagnostico, estado });

    const turno = await updateTurnoService(
      { _id: id, ...professionalScope.professionalFilter },
      turnoData
    );

    if (!turno) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    const pacienteId = normalizePacienteInput(paciente);
    if (pacienteId) {
      await registerProfessionalForPaciente(pacienteId, professionalScope.professionalId);
    }

    const turnoActualizado = await getTurno({ _id: id, ...professionalScope.professionalFilter });
    res.json({
      turno: turnoActualizado ? toTurnoListDTO(turnoActualizado) : null,
      professionalId: professionalScope.professionalId,
      professionalName: professionalScope.professionalName
    });
  } catch (error) {
    logger.error('Error al actualizar turno (API):', error);
    res.status(500).json({ error: 'Error al actualizar turno' });
  }
};

export const deleteTurnoApi = async (req, res) => {
  try {
    const { id } = req.params;
    const professionalScope = await resolveProfessionalScope(req);
    const userRole = req.context?.user?.role || req.session?.user?.role;
    const deletedBy = req.context?.user?.id || req.session?.user?.id || null;
    const force = userRole === 'superadmin';
    const isAssistant = userRole === 'assistant';

    if (isAssistant) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar turnos' });
    }

    if (handleScopeGuard(professionalScope, res)) {
      return;
    }

    const turno = await deleteTurnoService(
      { _id: id, ...professionalScope.professionalFilter },
      { force, deletedBy }
    );

    if (!turno) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    res.json({
      success: true,
      deletedId: id
    });
  } catch (error) {
    logger.error('Error al eliminar turno (API):', error);
    res.status(500).json({ error: 'Error al eliminar turno' });
  }
};

export const createTurnosBulkApi = async (req, res) => {
  try {
    const bodyProfessionalId = req.body.professionalId;
    const professionalId = isAdmin(req)
      ? (bodyProfessionalId || getScopedProfessionalId(req))
      : requireProfessionalId(req);

    if (!professionalId) {
      return res.status(400).json({ error: 'Debes seleccionar un profesional para crear turnos' });
    }

    const turnosData = (req.body.turnos || []).map((t) => ({
      fecha: t.fecha,
      hora: t.hora,
      observacionesTurno: t.observacionesTurno,
      diagnostico: t.diagnostico,
      estado: t.estado || 'pendiente',
      professional: professionalId
    }));

    if (!turnosData.length) {
      return res.status(400).json({ error: 'No se enviaron turnos para crear' });
    }

    const resultado = await createManyTurnosService(turnosData);
    const turnosDto = resultado.map((t) => toTurnoListDTO(t.toObject ? t.toObject() : t));

    res.status(201).json({
      success: true,
      created: turnosDto.length,
      turnos: turnosDto
    });
  } catch (error) {
    logger.error('Error al crear rango de turnos (API):', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al crear los turnos'
    });
  }
};

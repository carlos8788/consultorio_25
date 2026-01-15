import {
  paginateTurnos,
  findTurno,
  findTurnoLean,
  createTurno as createTurnoRepo,
  updateTurno as updateTurnoRepo,
  deleteTurno as deleteTurnoRepo,
  createManyTurnos as createManyTurnosRepo,
  findTurnosByProfessionalFechaHora,
  getTodasLasFechas
} from '../repositories/turnoRepository.js';
import { toTurnoListDTO, turnosHelpers } from '../dtos/turnoDto.js';

export const listTurnos = async ({ page, limit, fecha, professionalFilter }) => {
  const safeFilter = professionalFilter && typeof professionalFilter === 'object'
    ? professionalFilter
    : {};
  const fechaFiltro = fecha ? new Date(fecha) : null;
  const query = fechaFiltro
    ? { fecha: fechaFiltro, ...safeFilter }
    : { ...safeFilter };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { fecha: -1, hora: 1 },
    populate: [
      {
        path: 'paciente',
        populate: {
          path: 'obraSocial'
        }
      },
      'professional'
    ],
    lean: true
  };

  const turnos = await paginateTurnos(query, options);
  const turnosConDto = turnos.docs.map(toTurnoListDTO);
  const turnosLibres = turnosConDto.filter((turno) => turno.turnoLibre);

  return {
    ...turnos,
    turnosLibres: turnosLibres.length,
    docs: turnosConDto
  };
};

export const getNextFechaConTurnos = async ({ fechaBase, professionalFilter }) => {
  const safeFilter = professionalFilter && typeof professionalFilter === 'object'
    ? professionalFilter
    : {};
  const query = {
    ...safeFilter,
    fecha: { $gte: fechaBase }
  };
  const nextTurno = await findTurnoLean(query);
  return nextTurno ? turnosHelpers.normalizeFechaISO(nextTurno.fecha) : null;
};

export const getTurno = (filter) => findTurno(filter);

export const createTurno = (data) => createTurnoRepo(data);

export const updateTurno = (filter, data) => updateTurnoRepo(filter, data);

export const deleteTurno = (filter, options = {}) => deleteTurnoRepo(filter, options);

export const createManyTurnos = async (turnosData) => {
  // Validar que todos los turnos tengan el mismo professionalId
  const professionalIds = [...new Set(turnosData.map(t => t.professional?.toString()))];

  if (professionalIds.length !== 1 || !professionalIds[0]) {
    throw new Error('Todos los turnos deben pertenecer al mismo professional');
  }

  const professionalId = professionalIds[0];

  // Buscar turnos existentes con la misma combinación professional-fecha-hora
  const turnosExistentes = await findTurnosByProfessionalFechaHora(professionalId, turnosData);

  // Si hay turnos existentes, abortar la operación
  if (turnosExistentes.length > 0) {
    const duplicados = turnosExistentes.map(t =>
      `${t.fecha} a las ${t.hora}`
    ).join(', ');

    throw new Error(
      `Ya existen turnos para este professional en las siguientes fechas/horas: ${duplicados}`
    );
  }

  // Si no hay duplicados, crear los turnos
  return createManyTurnosRepo(turnosData);
};

const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getFechasDisponibles = async (professionalFilter, fechaSeleccionada = '') => {
  const fechaSeleccionadaISO = turnosHelpers.normalizeFechaISO(fechaSeleccionada) || '';
  const hoy = formatDateLocal(new Date());

  const fechasTodas = await getTodasLasFechas(professionalFilter || {});
  const ordenadas = [...fechasTodas].sort((a, b) => a.localeCompare(b));
  const fechasPasadas = ordenadas.filter((f) => f < hoy);
  const fechasFuturas = ordenadas.filter((f) => f >= hoy);
  const ultimasPasadas = fechasPasadas.slice(-4);

  const fechasBase = [...ultimasPasadas, ...fechasFuturas];

  // Siempre incluye la fecha seleccionada para no perder el filtro
  if (fechaSeleccionadaISO && !fechasBase.includes(fechaSeleccionadaISO)) {
    fechasBase.push(fechaSeleccionadaISO);
  }

  return {
    fechasDisponibles: Array.from(new Set(fechasBase)).sort((a, b) => a.localeCompare(b)),
    fechasFuturas,
    fechasPasadas: ultimasPasadas,
    fechasTodas: ordenadas
  };
};

export const turnoHelpers = turnosHelpers;


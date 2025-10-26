import {
  listTurnos,
  getNextFechaConTurnos,
  getTurno,
  createTurno as createTurnoService,
  updateTurno as updateTurnoService,
  deleteTurno as deleteTurnoService,
  turnoHelpers
} from '../services/turnoService.js';
import { buildPaginationData } from '../utils/pagination.js';
import { logger } from '../logger/index.js';

const isAdmin = (req) => req.context?.isAdmin || req.session?.user?.role === 'admin';

const requireDoctorId = (req) => {
  const doctorId = req.context?.doctorId || req.session?.user?.doctorId;
  if (!doctorId) {
    throw new Error('El usuario no tiene un médico asociado');
  }
  return doctorId;
};

const buildDoctorFilter = (req) => {
  if (isAdmin(req)) {
    return {};
  }
  return { doctor: requireDoctorId(req) };
};

export const getAllTurnos = async (req, res) => {
  try {
    let { page = 1, limit = 10, fecha = '' } = req.query;
    const doctorFilter = buildDoctorFilter(req);

    if (!fecha) {
      const hoy = new Date().toISOString().split('T')[0];
      const proximaFecha = await getNextFechaConTurnos({ fechaBase: hoy, doctorFilter });
      if (proximaFecha) {
        fecha = proximaFecha;
      }
    }

    const turnos = await listTurnos({
      page,
      limit,
      fecha,
      doctorFilter
    });

    const fechaActualDisplay = fecha ? turnoHelpers.formatFechaCorta(fecha) : '';
    const queryParams = {
      ...req.query,
      ...(fecha ? { fecha } : {})
    };
    const { pagination, paginationDisplay, paginationQuery } = buildPaginationData(
      turnos,
      queryParams
    );

    res.render('pages/turnos', {
      title: 'Turnos',
      turnos: turnos.docs,
      fechaActual: fecha,
      fechaActualDisplay,
      paginationQuery,
      paginationDisplay,
      pagination
    });
  } catch (error) {
    logger.error('Error al obtener turnos:', error);
    res.status(500).render('error', { error: 'Error al obtener turnos' });
  }
};

export const getTurnoById = async (req, res) => {
  try {
    const { id } = req.params;
    const turno = await getTurno({ _id: id, ...buildDoctorFilter(req) });

    if (!turno) {
      return res.status(404).render('error', { error: 'Turno no encontrado' });
    }

    res.render('pages/turnoDetalle', {
      title: `Turno - ${turno.fecha} ${turno.hora}`,
      turno
    });
  } catch (error) {
    logger.error('Error al obtener turno:', error);
    res.status(500).render('error', { error: 'Error al obtener turno' });
  }
};

export const createTurno = async (req, res) => {
  try {
    const { paciente, fecha, hora, diagnostico, estado } = req.body;
    const doctorId = isAdmin(req) ? (req.body.doctor || req.context?.doctorId || req.session?.user?.doctorId || null) : requireDoctorId(req);

    await createTurnoService({
      paciente: paciente || undefined,
      fecha,
      hora,
      diagnostico,
      estado,
      doctor: doctorId
    });

    res.redirect('/turnos');
  } catch (error) {
    logger.error('Error al crear turno:', error);
    res.status(500).render('error', { error: 'Error al crear turno' });
  }
};

export const updateTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const { paciente, fecha, hora, diagnostico, estado } = req.body;

    const turno = await updateTurnoService(
      { _id: id, ...buildDoctorFilter(req) },
      { paciente, fecha, hora, diagnostico, estado }
    );

    if (!turno) {
      return res.status(404).render('error', { error: 'Turno no encontrado' });
    }

    res.redirect('/turnos');
  } catch (error) {
    logger.error('Error al actualizar turno:', error);
    res.status(500).render('error', { error: 'Error al actualizar turno' });
  }
};

export const deleteTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const turno = await deleteTurnoService({ _id: id, ...buildDoctorFilter(req) });

    if (!turno) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    res.redirect('/turnos');
  } catch (error) {
    logger.error('Error al eliminar turno:', error);
    res.status(500).json({ error: 'Error al eliminar turno' });
  }
};

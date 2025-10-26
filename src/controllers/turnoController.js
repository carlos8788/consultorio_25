import {
  listTurnos,
  getNextFechaConTurnos,
  getTurno,
  createTurno as createTurnoService,
  updateTurno as updateTurnoService,
  deleteTurno as deleteTurnoService,
  turnoHelpers
} from '../services/turnoService.js';
import { registerDoctorForPaciente } from '../services/pacienteService.js';
import { getDoctorByIdOrFail } from '../services/doctorService.js';
import { buildPaginationData } from '../utils/pagination.js';
import { logger } from '../logger/index.js';
import {
  ADMIN_DOCTOR_SESSION_KEY,
  ADMIN_DOCTOR_NAME_SESSION_KEY
} from '../constants/contextKeys.js';

const isAdmin = (req) => req.context?.isAdmin || req.session?.user?.role === 'admin';

const requireDoctorId = (req) => {
  const doctorId = req.context?.doctorId || req.session?.user?.doctorId;
  if (!doctorId) {
    throw new Error('El usuario no tiene un médico asociado');
  }
  return doctorId;
};

const getScopedDoctorId = (req) => {
  if (isAdmin(req)) {
    return req.query?.doctorId || req.session?.[ADMIN_DOCTOR_SESSION_KEY] || null;
  }
  return req.context?.doctorId || req.session?.user?.doctorId || null;
};

const persistAdminDoctorSelection = (req, doctorId, doctorName) => {
  if (isAdmin(req) && doctorId) {
    req.session[ADMIN_DOCTOR_SESSION_KEY] = doctorId;
    if (doctorName) {
      req.session[ADMIN_DOCTOR_NAME_SESSION_KEY] = doctorName;
    }
  }
};

const formatDoctorName = (doctor) => {
  if (!doctor) return '';
  const parts = [doctor.apellido, doctor.nombre].filter(Boolean);
  if (parts.length) {
    return parts.join(', ');
  }
  return doctor.userId || '';
};

const resolveDoctorScope = async (req) => {
  const scopedDoctorId = getScopedDoctorId(req);

  if (!scopedDoctorId) {
    return {
      doctorId: null,
      doctorName: null,
      doctorFilter: null,
      requiresSelection: isAdmin(req),
      invalidDoctor: false
    };
  }

  if (!isAdmin(req)) {
    return {
      doctorId: scopedDoctorId,
      doctorName: req.context?.doctorName || '',
      doctorFilter: { doctor: scopedDoctorId },
      requiresSelection: false,
      invalidDoctor: false
    };
  }

  const doctor = await getDoctorByIdOrFail(scopedDoctorId);
  if (!doctor) {
    return {
      doctorId: null,
      doctorName: null,
      doctorFilter: null,
      requiresSelection: false,
      invalidDoctor: true
    };
  }

  const doctorName = formatDoctorName(doctor);
  persistAdminDoctorSelection(req, scopedDoctorId, doctorName);

  return {
    doctorId: scopedDoctorId,
    doctorName,
    doctorFilter: { doctor: scopedDoctorId },
    requiresSelection: false,
    invalidDoctor: false
  };
};

export const getAllTurnos = async (req, res) => {
  try {
    let { page = 1, limit = 10, fecha = '' } = req.query;
    const doctorScope = await resolveDoctorScope(req);

    if (doctorScope.requiresSelection) {
      return res.render('pages/turnos', {
        title: 'Turnos',
        turnos: [],
        fechaActual: '',
        fechaActualDisplay: '',
        pagination: null,
        paginationDisplay: [],
        paginationQuery: '',
        requiresDoctorSelection: true,
        doctorId: null,
        doctorName: null
      });
    }

    if (doctorScope.invalidDoctor) {
      return res.status(404).render('error', { error: 'Médico no encontrado' });
    }

    const doctorFilter = doctorScope.doctorFilter;

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
      {
        ...queryParams,
        ...(doctorScope.doctorId ? { doctorId: doctorScope.doctorId } : {})
      }
    );

    res.render('pages/turnos', {
      title: 'Turnos',
      turnos: turnos.docs,
      fechaActual: fecha,
      fechaActualDisplay,
      paginationQuery,
      paginationDisplay,
      pagination,
      doctorId: doctorScope.doctorId,
      doctorName: doctorScope.doctorName
    });
  } catch (error) {
    logger.error('Error al obtener turnos:', error);
    res.status(500).render('error', { error: 'Error al obtener turnos' });
  }
};

export const getTurnoById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorScope = await resolveDoctorScope(req);

    if (doctorScope.requiresSelection) {
      return res.status(400).render('error', { error: 'Seleccioná un médico para continuar' });
    }

    if (doctorScope.invalidDoctor) {
      return res.status(404).render('error', { error: 'Médico no encontrado' });
    }

    const turno = await getTurno({ _id: id, ...doctorScope.doctorFilter });

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
    const doctorId = isAdmin(req)
      ? (req.body.doctor || getScopedDoctorId(req))
      : requireDoctorId(req);

    if (!doctorId) {
      return res.status(400).render('error', { error: 'Debes seleccionar un médico para crear turnos' });
    }

    persistAdminDoctorSelection(req, doctorId);

    await createTurnoService({
      paciente: paciente || undefined,
      fecha,
      hora,
      diagnostico,
      estado,
      doctor: doctorId
    });

    if (paciente) {
      await registerDoctorForPaciente(paciente, doctorId);
    }

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
    const doctorScope = await resolveDoctorScope(req);

    if (doctorScope.requiresSelection) {
      return res.status(400).render('error', { error: 'Seleccioná un médico para continuar' });
    }

    if (doctorScope.invalidDoctor) {
      return res.status(404).render('error', { error: 'Médico no encontrado' });
    }

    const turno = await updateTurnoService(
      { _id: id, ...doctorScope.doctorFilter },
      { paciente, fecha, hora, diagnostico, estado }
    );

    if (!turno) {
      return res.status(404).render('error', { error: 'Turno no encontrado' });
    }

    if (paciente) {
      await registerDoctorForPaciente(paciente, doctorScope.doctorId);
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
    const doctorScope = await resolveDoctorScope(req);

    if (doctorScope.requiresSelection) {
      return res.status(400).json({ error: 'Seleccioná un médico para continuar' });
    }

    if (doctorScope.invalidDoctor) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    const turno = await deleteTurnoService({ _id: id, ...doctorScope.doctorFilter });

    if (!turno) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    res.redirect('/turnos');
  } catch (error) {
    logger.error('Error al eliminar turno:', error);
    res.status(500).json({ error: 'Error al eliminar turno' });
  }
};

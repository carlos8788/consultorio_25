import {
  listPacientes,
  getPaciente,
  createPaciente as createPacienteService,
  updatePaciente as updatePacienteService,
  deletePaciente as deletePacienteService,
  registerDoctorForPaciente
} from '../services/pacienteService.js';
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

const buildDoctorOwnershipFilter = (doctorId) => ({
  $or: [
    { doctor: doctorId },
    { doctores: doctorId }
  ]
});

const buildDoctorList = (input, primaryDoctorId) => {
  const doctorIds = new Set();

  const appendDoctor = (value) => {
    if (!value) return;
    doctorIds.add(value.toString());
  };

  if (primaryDoctorId) {
    appendDoctor(primaryDoctorId);
  }

  if (Array.isArray(input)) {
    input.forEach(appendDoctor);
  } else if (typeof input === 'string' && input.trim()) {
    input.split(',').map((value) => value.trim()).forEach(appendDoctor);
  }

  return Array.from(doctorIds);
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
      doctorFilter: buildDoctorOwnershipFilter(scopedDoctorId),
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
    doctorFilter: buildDoctorOwnershipFilter(scopedDoctorId),
    requiresSelection: false,
    invalidDoctor: false
  };
};

export const getAllPacientes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const doctorScope = await resolveDoctorScope(req);

    if (doctorScope.requiresSelection) {
      return res.render('pages/pacientes', {
        title: 'Pacientes',
        pacientes: [],
        search,
        pagination: null,
        paginationDisplay: [],
        paginationQuery: '',
        doctorId: null,
        doctorName: null,
        requiresDoctorSelection: true
      });
    }

    if (doctorScope.invalidDoctor) {
      return res.status(404).render('error', { error: 'Médico no encontrado' });
    }

    const pacientes = await listPacientes({
      search,
      page,
      limit,
      doctorFilter: doctorScope.doctorFilter
    });

    const { pagination, paginationDisplay, paginationQuery } = buildPaginationData(
      pacientes,
      {
        ...req.query,
        ...(doctorScope.doctorId ? { doctorId: doctorScope.doctorId } : {})
      }
    );

    res.render('pages/pacientes', {
      title: 'Pacientes',
      pacientes: pacientes.docs,
      search,
      paginationDisplay,
      paginationQuery,
      pagination,
      doctorId: doctorScope.doctorId,
      doctorName: doctorScope.doctorName
    });
  } catch (error) {
    logger.error('Error al obtener pacientes:', error);
    res.status(500).render('error', { error: 'Error al obtener pacientes' });
  }
};

export const getPacienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorScope = await resolveDoctorScope(req);

    if (doctorScope.requiresSelection) {
      return res.status(400).render('error', { error: 'Seleccioná un médico para continuar' });
    }

    if (doctorScope.invalidDoctor) {
      return res.status(404).render('error', { error: 'Médico no encontrado' });
    }

    const paciente = await getPaciente({ _id: id, ...doctorScope.doctorFilter });

    if (!paciente) {
      return res.status(404).render('error', { error: 'Paciente no encontrado' });
    }

    res.render('pages/pacienteDetalle', {
      title: `Paciente - ${paciente.apellido}, ${paciente.nombre}`,
      paciente
    });
  } catch (error) {
    logger.error('Error al obtener paciente:', error);
    res.status(500).render('error', { error: 'Error al obtener paciente' });
  }
};

export const createPaciente = async (req, res) => {
  try {
    const { nombre, apellido, dni, telefono, obraSocial, observaciones, edad, fechaNacimiento } = req.body;
    const doctorId = isAdmin(req)
      ? (req.body.doctor || getScopedDoctorId(req))
      : requireDoctorId(req);

    if (!doctorId) {
      return res.status(400).render('error', { error: 'Debes seleccionar un médico para crear pacientes' });
    }

    persistAdminDoctorSelection(req, doctorId);

    const doctores = buildDoctorList(req.body.doctores, doctorId);

    const nuevoPaciente = await createPacienteService({
      nombre,
      apellido,
      dni,
      telefono,
      obraSocial: obraSocial || undefined,
      observaciones,
      edad,
      fechaNacimiento,
      doctor: doctorId,
      doctores
    });

    await registerDoctorForPaciente(nuevoPaciente._id, doctorId);

    res.redirect('/pacientes');
  } catch (error) {
    logger.error('Error al crear paciente:', error);
    res.status(500).render('error', { error: 'Error al crear paciente' });
  }
};

export const updatePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, dni, telefono, obraSocial, observaciones, edad, fechaNacimiento } = req.body;
    const doctorScope = await resolveDoctorScope(req);

    if (doctorScope.requiresSelection) {
      return res.status(400).render('error', { error: 'Seleccioná un médico para continuar' });
    }

    if (doctorScope.invalidDoctor) {
      return res.status(404).render('error', { error: 'Médico no encontrado' });
    }

    const updatePayload = {
      nombre,
      apellido,
      dni,
      telefono,
      obraSocial,
      observaciones,
      edad,
      fechaNacimiento
    };

    if (req.body.doctores) {
      updatePayload.doctores = buildDoctorList(req.body.doctores, doctorScope.doctorId);
    }

    const paciente = await updatePacienteService(
      { _id: id, ...doctorScope.doctorFilter },
      updatePayload
    );

    if (!paciente) {
      return res.status(404).render('error', { error: 'Paciente no encontrado' });
    }

    await registerDoctorForPaciente(paciente._id, doctorScope.doctorId);

    res.redirect('/pacientes');
  } catch (error) {
    logger.error('Error al actualizar paciente:', error);
    res.status(500).render('error', { error: 'Error al actualizar paciente' });
  }
};

export const deletePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorScope = await resolveDoctorScope(req);

    if (doctorScope.requiresSelection) {
      return res.status(400).json({ error: 'Seleccioná un médico para continuar' });
    }

    if (doctorScope.invalidDoctor) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    const paciente = await deletePacienteService({ _id: id, ...doctorScope.doctorFilter });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.redirect('/pacientes');
  } catch (error) {
    logger.error('Error al eliminar paciente:', error);
    res.status(500).json({ error: 'Error al eliminar paciente' });
  }
};

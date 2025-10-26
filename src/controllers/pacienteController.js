import {
  listPacientes,
  getPaciente,
  createPaciente as createPacienteService,
  updatePaciente as updatePacienteService,
  deletePaciente as deletePacienteService
} from '../services/pacienteService.js';
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

export const getAllPacientes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const pacientes = await listPacientes({
      search,
      page,
      limit,
      doctorFilter: buildDoctorFilter(req)
    });

    const { pagination, paginationDisplay, paginationQuery } = buildPaginationData(
      pacientes,
      req.query
    );

    res.render('pages/pacientes', {
      title: 'Pacientes',
      pacientes: pacientes.docs,
      search,
      paginationDisplay,
      paginationQuery,
      pagination
    });
  } catch (error) {
    logger.error('Error al obtener pacientes:', error);
    res.status(500).render('error', { error: 'Error al obtener pacientes' });
  }
};

export const getPacienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const paciente = await getPaciente({ _id: id, ...buildDoctorFilter(req) });

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
    const doctorId = isAdmin(req) ? (req.body.doctor || req.context?.doctorId || req.session?.user?.doctorId || null) : requireDoctorId(req);

    await createPacienteService({
      nombre,
      apellido,
      dni,
      telefono,
      obraSocial: obraSocial || undefined,
      observaciones,
      edad,
      fechaNacimiento,
      doctor: doctorId
    });

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

    const paciente = await updatePacienteService(
      { _id: id, ...buildDoctorFilter(req) },
      { nombre, apellido, dni, telefono, obraSocial, observaciones, edad, fechaNacimiento }
    );

    if (!paciente) {
      return res.status(404).render('error', { error: 'Paciente no encontrado' });
    }

    res.redirect('/pacientes');
  } catch (error) {
    logger.error('Error al actualizar paciente:', error);
    res.status(500).render('error', { error: 'Error al actualizar paciente' });
  }
};

export const deletePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const paciente = await deletePacienteService({ _id: id, ...buildDoctorFilter(req) });

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.redirect('/pacientes');
  } catch (error) {
    logger.error('Error al eliminar paciente:', error);
    res.status(500).json({ error: 'Error al eliminar paciente' });
  }
};

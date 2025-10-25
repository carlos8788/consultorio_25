import Paciente from '../models/Paciente.js';
import { buildPaginationData } from '../utils/pagination.js';

export const getAllPacientes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = search 
      ? { 
          $or: [
            { nombre: { $regex: search, $options: 'i' } },
            { apellido: { $regex: search, $options: 'i' } },
            { dni: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { apellido: 1, nombre: 1 },
      populate: 'obraSocial',
      lean: true
    };

    const pacientes = await Paciente.paginate(query, options);
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
    console.error('Error al obtener pacientes:', error);
    res.status(500).render('error', { error: 'Error al obtener pacientes' });
  }
};

export const getPacienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const paciente = await Paciente.findById(id).populate('obraSocial').lean();

    if (!paciente) {
      return res.status(404).render('error', { error: 'Paciente no encontrado' });
    }

    res.render('pages/pacienteDetalle', {
      title: `Paciente - ${paciente.apellido}, ${paciente.nombre}`,
      paciente
    });
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    res.status(500).render('error', { error: 'Error al obtener paciente' });
  }
};

export const createPaciente = async (req, res) => {
  try {
    const { nombre, apellido, dni, telefono, obraSocial, observaciones, edad, fechaNacimiento } = req.body;
    
    const newPaciente = new Paciente({
      nombre,
      apellido,
      dni,
      telefono,
      obraSocial: obraSocial || undefined,
      observaciones,
      edad,
      fechaNacimiento
    });

    await newPaciente.save();
    res.redirect('/pacientes');
  } catch (error) {
    console.error('Error al crear paciente:', error);
    res.status(500).render('error', { error: 'Error al crear paciente' });
  }
};

export const updatePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, dni, telefono, obraSocial, observaciones, edad, fechaNacimiento } = req.body;

    const paciente = await Paciente.findByIdAndUpdate(
      id,
      { nombre, apellido, dni, telefono, obraSocial, observaciones, edad, fechaNacimiento },
      { new: true, runValidators: true }
    );

    if (!paciente) {
      return res.status(404).render('error', { error: 'Paciente no encontrado' });
    }

    res.redirect('/pacientes');
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    res.status(500).render('error', { error: 'Error al actualizar paciente' });
  }
};

export const deletePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const paciente = await Paciente.findByIdAndDelete(id);

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.redirect('/pacientes');
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    res.status(500).json({ error: 'Error al eliminar paciente' });
  }
};

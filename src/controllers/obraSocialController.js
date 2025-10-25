import ObraSocial from '../models/ObraSocial.js';
import { buildPaginationData } from '../utils/pagination.js';

export const getAllObrasSociales = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = search 
      ? { nombre: { $regex: search, $options: 'i' } }
      : {};

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { nombre: 1 },
      lean: true
    };

    const obrasSociales = await ObraSocial.paginate(query, options);
    const { pagination, paginationDisplay, paginationQuery } = buildPaginationData(
      obrasSociales,
      req.query
    );

    res.render('pages/obrasSociales', {
      title: 'Obras Sociales',
      obrasSociales: obrasSociales.docs,
      search,
      paginationDisplay,
      paginationQuery,
      pagination
    });
  } catch (error) {
    console.error('Error al obtener obras sociales:', error);
    res.status(500).render('error', { error: 'Error al obtener obras sociales' });
  }
};

export const getObraSocialById = async (req, res) => {
  try {
    const { id } = req.params;
    const obraSocial = await ObraSocial.findById(id).lean();

    if (!obraSocial) {
      return res.status(404).render('error', { error: 'Obra Social no encontrada' });
    }

    res.render('pages/obraSocialDetalle', {
      title: `Obra Social - ${obraSocial.nombre}`,
      obraSocial
    });
  } catch (error) {
    console.error('Error al obtener obra social:', error);
    res.status(500).render('error', { error: 'Error al obtener obra social' });
  }
};

export const createObraSocial = async (req, res) => {
  try {
    const { nombre, telefono, direccion, padron } = req.body;
    
    const newObraSocial = new ObraSocial({
      nombre,
      telefono,
      direccion,
      padron
    });

    await newObraSocial.save();
    res.redirect('/obras-sociales');
  } catch (error) {
    console.error('Error al crear obra social:', error);
    res.status(500).render('error', { error: 'Error al crear obra social' });
  }
};

export const updateObraSocial = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, direccion, padron } = req.body;

    const obraSocial = await ObraSocial.findByIdAndUpdate(
      id,
      { nombre, telefono, direccion, padron },
      { new: true, runValidators: true }
    );

    if (!obraSocial) {
      return res.status(404).render('error', { error: 'Obra Social no encontrada' });
    }

    res.redirect('/obras-sociales');
  } catch (error) {
    console.error('Error al actualizar obra social:', error);
    res.status(500).render('error', { error: 'Error al actualizar obra social' });
  }
};

export const deleteObraSocial = async (req, res) => {
  try {
    const { id } = req.params;
    const obraSocial = await ObraSocial.findByIdAndDelete(id);

    if (!obraSocial) {
      return res.status(404).json({ error: 'Obra Social no encontrada' });
    }

    res.redirect('/obras-sociales');
  } catch (error) {
    console.error('Error al eliminar obra social:', error);
    res.status(500).json({ error: 'Error al eliminar obra social' });
  }
};

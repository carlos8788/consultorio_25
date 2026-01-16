import ObraSocial from '../models/ObraSocial.js';
import { logger } from '../logger/index.js';

export const listObrasSocialesApi = async (req, res) => {
  try {
    const obras = await ObraSocial.find({})
      .sort({ nombre: 1 })
      .select('nombre padron telefono direccion _id')
      .lean();

    res.json({
      obrasSociales: obras.map((obra) => ({
        _id: obra._id?.toString(),
        id: obra._id?.toString(), // alias para compatibilidad
        nombre: obra.nombre,
        padron: obra.padron || null,
        telefono: obra.telefono || '',
        direccion: obra.direccion || ''
      }))
    });
  } catch (error) {
    logger.error('Error al listar obras sociales (API):', error);
    res.status(500).json({ error: 'No se pudieron obtener las obras sociales' });
  }
};

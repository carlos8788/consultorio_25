import {
  resolveProfessionalScope,
  requireProfessionalId,
  isAdmin,
  getScopedProfessionalId,
  persistAdminProfessionalSelection
} from '../utils/turnoScope.js';
import {
  createInteresado,
  listInteresados,
  updateInteresadoService,
  deleteInteresadoService,
  getInteresado
} from '../services/interesadoService.js';
import { logger } from '../logger/index.js';

const toInteresadoDTO = (interesado) => ({
  id: interesado?._id?.toString() || interesado?.id || null,
  professional: interesado?.professional || null,
  paciente: interesado?.paciente || null,
  nombre: interesado?.nombre || '',
  apellido: interesado?.apellido || '',
  telefono: interesado?.telefono || '',
  comentario: interesado?.comentario || '',
  origen: interesado?.origen || '',
  estado: interesado?.estado || '',
  createdAt: interesado?.createdAt || null
});

export const createInteresadoApi = async (req, res) => {
  try {
    const professionalId = isAdmin(req)
      ? (req.body.professional || getScopedProfessionalId(req))
      : requireProfessionalId(req);

    if (!professionalId) {
      return res.status(400).json({ error: 'Selecciona un profesional para continuar' });
    }

    persistAdminProfessionalSelection(req, professionalId);

    const payload = {
      professional: professionalId,
      paciente: req.body.paciente || null,
      nombre: req.body.nombre || '',
      apellido: req.body.apellido || '',
      telefono: req.body.telefono || '',
      comentario: req.body.comentario || '',
      origen: req.body.origen || 'licencia',
      estado: req.body.estado || 'pendiente'
    };

    const interesado = await createInteresado(payload);

    res.status(201).json({
      interesado: toInteresadoDTO(interesado)
    });
  } catch (error) {
    logger.error('Error al crear interesado (API):', error);
    res.status(500).json({ error: 'No se pudo registrar el interesado' });
  }
};

export const listInteresadosApi = async (req, res) => {
  try {
    const professionalScope = await resolveProfessionalScope(req);
    if (professionalScope.requiresSelection) {
      return res.status(400).json({ error: 'Selecciona un profesional para continuar' });
    }
    if (professionalScope.invalidProfessional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const interesados = await listInteresados({
      professionalId: professionalScope.professionalId,
      limit: Math.min(parseInt(req.query.limit, 10) || 50, 200)
    });

    res.json({ interesados: interesados.map(toInteresadoDTO) });
  } catch (error) {
    logger.error('Error al listar interesados (API):', error);
    res.status(500).json({ error: 'No se pudo obtener la lista de interesados' });
  }
};

export const getInteresadoApi = async (req, res) => {
  try {
    const professionalScope = await resolveProfessionalScope(req);
    if (professionalScope.requiresSelection) {
      return res.status(400).json({ error: 'Selecciona un profesional para continuar' });
    }
    if (professionalScope.invalidProfessional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const interesado = await getInteresado(req.params.id, professionalScope.isAdmin ? null : professionalScope.professionalId);
    if (!interesado) {
      return res.status(404).json({ error: 'Interesado no encontrado' });
    }

    return res.json({ interesado: toInteresadoDTO(interesado) });
  } catch (error) {
    logger.error('Error al obtener interesado (API):', error);
    res.status(500).json({ error: 'No se pudo obtener el interesado' });
  }
};

export const updateInteresadoApi = async (req, res) => {
  try {
    const professionalScope = await resolveProfessionalScope(req);
    if (professionalScope.requiresSelection) {
      return res.status(400).json({ error: 'Selecciona un profesional para continuar' });
    }
    if (professionalScope.invalidProfessional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const updates = {
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      telefono: req.body.telefono,
      comentario: req.body.comentario,
      origen: req.body.origen,
      estado: req.body.estado,
      paciente: req.body.paciente
    };

    const updated = await updateInteresadoService(req.params.id, updates, {
      professionalId: professionalScope.isAdmin ? null : professionalScope.professionalId
    });

    if (!updated) {
      return res.status(404).json({ error: 'Interesado no encontrado' });
    }

    return res.json({ interesado: toInteresadoDTO(updated) });
  } catch (error) {
    logger.error('Error al actualizar interesado (API):', error);
    res.status(500).json({ error: 'No se pudo actualizar el interesado' });
  }
};

export const deleteInteresadoApi = async (req, res) => {
  try {
    const professionalScope = await resolveProfessionalScope(req);
    if (professionalScope.requiresSelection) {
      return res.status(400).json({ error: 'Selecciona un profesional para continuar' });
    }
    if (professionalScope.invalidProfessional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const deleted = await deleteInteresadoService(req.params.id, {
      professionalId: professionalScope.isAdmin ? null : professionalScope.professionalId
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Interesado no encontrado' });
    }

    return res.json({ success: true });
  } catch (error) {
    logger.error('Error al eliminar interesado (API):', error);
    res.status(500).json({ error: 'No se pudo eliminar el interesado' });
  }
};

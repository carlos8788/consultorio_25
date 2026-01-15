import { listProfessionals, getProfessionalByIdOrFail } from '../services/professionalService.js';
import {
  ADMIN_PROFESSIONAL_SESSION_KEY,
  ADMIN_PROFESSIONAL_NAME_SESSION_KEY
} from '../constants/contextKeys.js';

const formatProfessionalLabel = (professional) => {
  if (!professional) return '';
  const nombre = [professional.apellido, professional.nombre].filter(Boolean).join(', ');
  const especialidad = professional.especialidad ? ` · ${professional.especialidad}` : '';
  return `${nombre}${especialidad}`;
};

export const getProfessionalsForContext = async (req, res) => {
  try {
    const professionals = await listProfessionals();
    res.json({
      professionals: professionals.map((professional) => ({
        id: professional._id.toString(),
        label: formatProfessionalLabel(professional)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener profesionales', details: error.message });
  }
};

export const setProfessionalContext = async (req, res) => {
  try {
    const { professionalId } = req.body;

    if (!professionalId) {
      return res.status(400).json({ error: 'Debes seleccionar un profesional' });
    }

    const professional = await getProfessionalByIdOrFail(professionalId);
    if (!professional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const professionalName = formatProfessionalLabel(professional);

    req.session[ADMIN_PROFESSIONAL_SESSION_KEY] = professionalId;
    req.session[ADMIN_PROFESSIONAL_NAME_SESSION_KEY] = professionalName;

    res.json({
      success: true,
      professionalId,
      professionalName
    });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo guardar la selección', details: error.message });
  }
};
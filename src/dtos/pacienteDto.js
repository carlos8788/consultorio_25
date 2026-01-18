import { getObservacionForProfessional } from '../utils/pacienteObservaciones.js';
import { normalizePacienteCobertura } from '../utils/pacienteCoberturas.js';

export const toPacienteSuggestionDTO = (paciente, { professionalId } = {}) => {
  const normalized = normalizePacienteCobertura(paciente, professionalId);
  return {
    id: normalized?._id?.toString() || normalized?.id || null,
    nombre: normalized?.nombre || '',
    apellido: normalized?.apellido || '',
    dni: normalized?.dni || '',
    telefono: normalized?.telefono || '',
    fechaNacimiento: normalized?.fechaNacimiento || '',
    obraSocial: normalized?.obraSocial
      ? {
          id: normalized.obraSocial?._id?.toString() || null,
          nombre: normalized.obraSocial?.nombre || ''
        }
      : null
  };
};

export const toPacienteListDTO = (paciente, { professionalId } = {}) => {
  const normalized = normalizePacienteCobertura(paciente, professionalId);
  return {
    ...normalized,
    observaciones: getObservacionForProfessional(normalized, professionalId),
    professionalNombre: normalized?.professional
      ? `${normalized.professional.nombre || ''} ${normalized.professional.apellido || ''}`.trim()
      : null,
    professionalsResumen: Array.isArray(normalized?.professionals)
      ? normalized.professionals
          .map((professional) => [professional?.apellido, professional?.nombre].filter(Boolean).join(', '))
          .filter(Boolean)
          .join(' | ')
      : ''
  };
};

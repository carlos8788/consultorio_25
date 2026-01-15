import { getObservacionForProfessional } from '../utils/pacienteObservaciones.js';

export const toPacienteSuggestionDTO = (paciente) => ({
  id: paciente?._id?.toString() || paciente?.id || null,
  nombre: paciente?.nombre || '',
  apellido: paciente?.apellido || '',
  dni: paciente?.dni || '',
  telefono: paciente?.telefono || '',
  fechaNacimiento: paciente?.fechaNacimiento || '',
  obraSocial: paciente?.obraSocial
    ? {
        id: paciente.obraSocial?._id?.toString() || null,
        nombre: paciente.obraSocial?.nombre || ''
      }
    : null
});

export const toPacienteListDTO = (paciente, { professionalId } = {}) => ({
  ...paciente,
  observaciones: getObservacionForProfessional(paciente, professionalId),
  professionalNombre: paciente?.professional
    ? `${paciente.professional.nombre || ''} ${paciente.professional.apellido || ''}`.trim()
    : null,
  professionalsResumen: Array.isArray(paciente?.professionals)
    ? paciente.professionals
        .map((professional) => [professional?.apellido, professional?.nombre].filter(Boolean).join(', '))
        .filter(Boolean)
        .join(' | ')
    : ''
});

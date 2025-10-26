export const toPacienteListDTO = (paciente) => ({
  ...paciente,
  doctorNombre: paciente?.doctor
    ? `${paciente.doctor.nombre || ''} ${paciente.doctor.apellido || ''}`.trim()
    : null,
  doctoresResumen: Array.isArray(paciente?.doctores)
    ? paciente.doctores
        .map((doctor) => [doctor?.apellido, doctor?.nombre].filter(Boolean).join(', '))
        .filter(Boolean)
        .join(' | ')
    : ''
});

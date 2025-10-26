export const toPacienteListDTO = (paciente) => ({
  ...paciente,
  doctorNombre: paciente?.doctor
    ? `${paciente.doctor.nombre || ''} ${paciente.doctor.apellido || ''}`.trim()
    : null
});

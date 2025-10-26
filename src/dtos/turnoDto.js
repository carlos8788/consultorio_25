const formatFechaCorta = (fecha) => {
  if (!fecha) return '';
  const partes = fecha.split('-');

  if (partes.length !== 3) {
    return fecha;
  }

  const [anio, mes, dia] = partes;
  if (!anio || !mes || !dia) {
    return fecha;
  }

  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${anio.slice(-2)}`;
};

const diagnosticoResaltaFila = (diagnostico) => {
  if (!diagnostico) return false;

  const normalizado = diagnostico
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return ['practica', 'limpieza', 'práctica'].some((palabra) => normalizado.includes(palabra));
};

export const toTurnoListDTO = (turno) => {
  const resaltarFila = diagnosticoResaltaFila(turno.diagnostico);
  const turnoLibre = !turno.paciente || !turno.paciente.apellido;
  const rowClass = [
    resaltarFila ? 'bg-practica' : '',
    turnoLibre ? 'bg-turno-libre' : ''
  ].filter(Boolean).join(' ');

  return {
    ...turno,
    fechaFormateada: formatFechaCorta(turno.fecha),
    resaltarFila,
    turnoLibre,
    rowClass
  };
};

export const toTurnoDetailDTO = (turno) => ({
  ...turno,
  fechaFormateada: formatFechaCorta(turno.fecha)
});

export const turnosHelpers = {
  formatFechaCorta
};

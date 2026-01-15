import { normalizePacienteObservaciones } from '../utils/pacienteObservaciones.js';

const normalizeFechaISO = (fecha) => {
  if (!fecha) return '';
  if (fecha instanceof Date) {
    return fecha.toISOString().split('T')[0];
  }

  const str = fecha.toString();
  if (!str) return '';

  if (str.includes('T')) {
    return str.split('T')[0];
  }

  const partes = str.split('-');
  if (partes.length !== 3) {
    return '';
  }

  const [anio, mes, dia] = partes;
  if (!anio || !mes || !dia) {
    return '';
  }

  const iso = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : '';
};

const formatFechaCorta = (fecha) => {
  const iso = normalizeFechaISO(fecha);
  if (!iso) return fecha || '';

  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio.slice(-2)}`;
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
  const fechaISO = normalizeFechaISO(turno.fecha);
  const rowClass = [
    resaltarFila ? 'bg-practica' : '',
    turnoLibre ? 'bg-turno-libre' : ''
  ].filter(Boolean).join(' ');

  const professionalId = turno?.professional?._id?.toString?.()
    || turno?.professional?.toString?.()
    || null;

  return {
    ...turno,
    paciente: normalizePacienteObservaciones(turno.paciente, professionalId),
    fecha: fechaISO || turno.fecha,
    fechaFormateada: formatFechaCorta(fechaISO || turno.fecha),
    fechaISO,
    resaltarFila,
    turnoLibre,
    rowClass
  };
};

export const toTurnoDetailDTO = (turno) => {
  const professionalId = turno?.professional?._id?.toString?.()
    || turno?.professional?.toString?.()
    || null;

  return {
    ...turno,
    paciente: normalizePacienteObservaciones(turno.paciente, professionalId),
    fecha: normalizeFechaISO(turno.fecha) || turno.fecha,
    fechaFormateada: formatFechaCorta(turno.fecha)
  };
};

export const turnosHelpers = {
  formatFechaCorta,
  normalizeFechaISO
};

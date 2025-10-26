import {
  paginateTurnos,
  findTurno,
  findTurnoLean,
  createTurno as createTurnoRepo,
  updateTurno as updateTurnoRepo,
  deleteTurno as deleteTurnoRepo
} from '../repositories/turnoRepository.js';
import { toTurnoListDTO, turnosHelpers } from '../dtos/turnoDto.js';

export const listTurnos = async ({ page, limit, fecha, doctorFilter }) => {
  const query = fecha
    ? { fecha, ...doctorFilter }
    : { ...doctorFilter };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { fecha: -1, hora: 1 },
    populate: [
      {
        path: 'paciente',
        populate: {
          path: 'obraSocial'
        }
      },
      'doctor'
    ],
    lean: true
  };

  const turnos = await paginateTurnos(query, options);
  return {
    ...turnos,
    docs: turnos.docs.map(toTurnoListDTO)
  };
};

export const getNextFechaConTurnos = async ({ fechaBase, doctorFilter }) => {
  const query = {
    ...doctorFilter,
    fecha: { $gte: fechaBase }
  };
  const nextTurno = await findTurnoLean(query);
  return nextTurno ? nextTurno.fecha : null;
};

export const getTurno = (filter) => findTurno(filter);

export const createTurno = (data) => createTurnoRepo(data);

export const updateTurno = (filter, data) => updateTurnoRepo(filter, data);

export const deleteTurno = (filter) => deleteTurnoRepo(filter);

export const turnoHelpers = turnosHelpers;

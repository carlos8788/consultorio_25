import {
  paginatePacientes,
  findPaciente,
  createPaciente as createPacienteRepo,
  updatePaciente as updatePacienteRepo,
  deletePaciente as deletePacienteRepo,
  addDoctorReference
} from '../repositories/pacienteRepository.js';
import { toPacienteListDTO } from '../dtos/pacienteDto.js';

const buildSearchQuery = (search) => {
  if (!search) return {};
  return {
    $or: [
      { nombre: { $regex: search, $options: 'i' } },
      { apellido: { $regex: search, $options: 'i' } },
      { dni: { $regex: search, $options: 'i' } }
    ]
  };
};

export const listPacientes = async ({ search, page, limit, doctorFilter }) => {
  const query = {
    ...buildSearchQuery(search),
    ...doctorFilter
  };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { apellido: 1, nombre: 1 },
    populate: ['obraSocial', 'doctor', 'doctores'],
    lean: true
  };

  const pacientes = await paginatePacientes(query, options);
  return {
    ...pacientes,
    docs: pacientes.docs.map(toPacienteListDTO)
  };
};

export const getPaciente = (filter) => findPaciente(filter);

export const createPaciente = (data) => createPacienteRepo(data);

export const updatePaciente = (filter, data) => updatePacienteRepo(filter, data);

export const deletePaciente = (filter) => deletePacienteRepo(filter);

export const registerDoctorForPaciente = (pacienteId, doctorId) => {
  if (!pacienteId || !doctorId) {
    return null;
  }
  return addDoctorReference(pacienteId, doctorId);
};

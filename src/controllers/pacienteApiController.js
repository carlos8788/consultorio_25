import {
  searchPacientes as searchPacientesService,
  createPaciente as createPacienteService,
  getPaciente,
  getPacienteIncludingDeleted,
  registerProfessionalForPaciente,
  updatePacienteIncludingDeleted,
  buildProfessionalOwnershipFilter
} from '../services/pacienteService.js';
import {
  resolveProfessionalScope,
  isAdmin,
  requireProfessionalId,
  persistAdminProfessionalSelection,
  getScopedProfessionalId
} from '../utils/turnoScope.js';
import { toPacienteSuggestionDTO } from '../dtos/pacienteDto.js';
import { logger } from '../logger/index.js';
import { buildObservacionesArray } from '../utils/pacienteObservaciones.js';

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return '';
  const dob = new Date(fechaNacimiento);
  if (Number.isNaN(dob.getTime())) return '';
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
};

const normalizeDni = (value) => String(value || '').trim();

const hasProfessionalLink = (paciente, professionalId) => {
  if (!paciente || !professionalId) return false;
  const target = professionalId.toString();
  const matches = (value) => value?.toString?.() === target;
  if (matches(paciente.professional)) return true;
  if (Array.isArray(paciente.professionals) && paciente.professionals.some(matches)) return true;
  return false;
};

const cleanUndefined = (payload = {}) =>
  Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));

export const searchPacientesApi = async (req, res) => {
  try {
    const professionalScope = await resolveProfessionalScope(req);

    if (professionalScope.requiresSelection) {
      return res.status(400).json({ error: 'Selecciona un profesional para continuar' });
    }

    if (professionalScope.invalidProfessional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const { term = '', dni = '', limit = 8 } = req.query;
    if (!term && !dni) {
      return res.json({ pacientes: [] });
    }

    const pacientes = await searchPacientesService({
      term: term.trim(),
      dni: dni.trim(),
      limit: Math.min(parseInt(limit, 10) || 8, 20),
      professionalFilter: buildProfessionalOwnershipFilter(professionalScope.professionalId)
    });

    res.json({ pacientes: pacientes.map(toPacienteSuggestionDTO) });
  } catch (error) {
    logger.error('Error al buscar pacientes (API):', error);
    res.status(500).json({ error: 'No se pudieron buscar pacientes' });
  }
};

export const createPacienteApi = async (req, res) => {
  try {
    const professionalId = isAdmin(req)
      ? (req.body.professional || getScopedProfessionalId(req))
      : requireProfessionalId(req);

    if (!professionalId) {
      return res.status(400).json({ error: 'Debes seleccionar un profesional para crear pacientes' });
    }

    persistAdminProfessionalSelection(req, professionalId);

    const { apellido, nombre, dni, telefono, observaciones, obraSocial, fechaNacimiento } = req.body;

    const normalizedDni = normalizeDni(dni);
    const observacionesList = buildObservacionesArray(observaciones, professionalId);
    const basePayload = cleanUndefined({
      apellido,
      nombre,
      dni: normalizedDni || undefined,
      telefono,
      observaciones: observacionesList.length ? observacionesList : undefined,
      obraSocial,
      fechaNacimiento: fechaNacimiento || undefined,
      edad: calcularEdad(fechaNacimiento)
    });

    if (normalizedDni) {
      const existing = await getPacienteIncludingDeleted({ dni: normalizedDni });
      if (existing) {
        const linked = hasProfessionalLink(existing, professionalId);

        if (existing.deletedAt) {
          const restorePayload = cleanUndefined({
            ...basePayload,
            deletedAt: null,
            deletedBy: null,
            professional: existing.professional || professionalId
          });

          await updatePacienteIncludingDeleted({ _id: existing._id }, restorePayload);
          await registerProfessionalForPaciente(existing._id, professionalId);

          const restored = await getPaciente({ _id: existing._id });
          return res.status(200).json({
            paciente: toPacienteSuggestionDTO(restored || existing),
            restored: true,
            professionalId
          });
        }

        if (!linked) {
          await registerProfessionalForPaciente(existing._id, professionalId);
          if (!existing.professional) {
            await updatePacienteIncludingDeleted(
              { _id: existing._id },
              { professional: professionalId }
            );
          }
        }

        const linkedPaciente = await getPaciente({ _id: existing._id });
        return res.status(200).json({
          paciente: toPacienteSuggestionDTO(linkedPaciente || existing),
          alreadyExists: true,
          linked: !linked,
          professionalId
        });
      }
    }

    const nuevoPaciente = await createPacienteService({
      ...basePayload,
      professional: professionalId,
      professionals: [professionalId]
    });

    await registerProfessionalForPaciente(nuevoPaciente._id, professionalId);

    res.status(201).json({
      paciente: toPacienteSuggestionDTO(nuevoPaciente),
      professionalId
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'El DNI ya existe' });
    }
    logger.error('Error al crear paciente (API):', error);
    res.status(500).json({ error: error.message || 'No se pudo crear el paciente' });
  }
};

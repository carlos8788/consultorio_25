import {
  listProfessionals,
  createProfessionalService,
  updateProfessionalService,
  deleteProfessionalService,
  getProfessionalByIdOrFail,
  resetProfessionalPasswordService
} from '../services/professionalService.js';
import { hashPassword } from '../utils/passwordUtils.js';

const toProfessionalDTO = (professional) => {
  if (!professional) return null;
  const base = professional.toObject ? professional.toObject() : professional;
  return {
    id: base._id?.toString?.() || base.id || null,
    userId: base.userId || '',
    username: base.username || '',
    nombre: base.nombre || '',
    apellido: base.apellido || '',
    especialidad: base.especialidad || '',
    matricula: base.matricula || '',
    email: base.email || '',
    telefono: base.telefono || '',
    passwordUpdatedAt: base.passwordUpdatedAt || null,
    deletedAt: base.deletedAt || null
  };
};

const sanitizePayload = (input = {}) => ({
  userId: input.userId?.trim() || undefined,
  username: input.username?.trim() || undefined,
  nombre: input.nombre?.trim() || undefined,
  apellido: input.apellido?.trim() || undefined,
  especialidad: input.especialidad?.trim() || undefined,
  matricula: input.matricula?.trim() || undefined,
  email: input.email?.trim() || undefined,
  telefono: input.telefono?.trim() || undefined
});

export const listProfessionalsApi = async (_req, res) => {
  try {
    const professionals = await listProfessionals();
    console.log(professionals)
    return res.json({ professionals: professionals.map(toProfessionalDTO) });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudieron listar los profesionales' });
  }
};

export const createProfessionalApi = async (req, res) => {
  try {
    const { password } = req.body || {};
    const payload = sanitizePayload(req.body);

    if (!payload.userId || !payload.username || !payload.nombre || !payload.apellido) {
      return res.status(400).json({ error: 'userId, username, nombre y apellido son obligatorios' });
    }

    const data = { ...payload };

    if (password && typeof password === 'string' && password.trim()) {
      data.passwordHash = await hashPassword(password);
      data.passwordUpdatedAt = new Date();
    }

    const professional = await createProfessionalService(data);
    return res.status(201).json({ professional: toProfessionalDTO(professional) });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'userId o username duplicado' });
    }
    return res.status(500).json({ error: 'No se pudo crear el profesional' });
  }
};

export const updateProfessionalApi = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body || {};
    const updates = sanitizePayload(req.body);

    if (password && typeof password === 'string' && password.trim()) {
      updates.passwordHash = await hashPassword(password);
      updates.passwordUpdatedAt = new Date();
    }

    const updated = await updateProfessionalService(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    return res.json({ professional: toProfessionalDTO(updated) });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo actualizar el profesional' });
  }
};

export const deleteProfessionalApi = async (req, res) => {
  try {
    const { id } = req.params;
    const professional = await getProfessionalByIdOrFail(id);
    if (!professional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    await deleteProfessionalService(id, {
      deletedBy: req.auth?.user?.id || req.context?.user?.id || null
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo eliminar el profesional' });
  }
};

export const resetProfessionalPasswordApi = async (req, res) => {
  try {
    const { id } = req.params;
    const { professional, password } = await resetProfessionalPasswordService(id);

    return res.json({
      professional: toProfessionalDTO(professional),
      newPassword: password,
      warning: 'La contraseña temporal se devuelve en esta respuesta. Guárdala de forma segura.'
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      error: error.message || 'No se pudo restablecer la contraseña'
    });
  }
};

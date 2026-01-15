import {
  listProfessionals,
  createProfessionalService,
  updateProfessionalService,
  deleteProfessionalService,
  getProfessionalByIdOrFail,
  getProfessionalByIdIncludingDeletedOrFail,
  restoreProfessionalService,
  resetProfessionalPasswordService
} from '../services/professionalService.js';
import { getLatestSubscriptionsForProfessionals, upsertActiveSubscription } from '../services/subscriptionService.js';
import { hashPassword } from '../utils/passwordUtils.js';
import { ROLES } from '../constants/roles.js';

const toProfessionalDTO = (professional, subscription = null) => {
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
    deletedAt: base.deletedAt || null,
    subscriptionStatus: subscription?.status || null,
    subscriptionPlan: subscription?.plan || null,
    subscriptionEndsAt: subscription?.fin || null
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

export const listProfessionalsApi = async (req, res) => {
  try {
    const includeDeletedParam = String(req.query?.includeDeleted || '').toLowerCase();
    const includeDeleted = includeDeletedParam === 'true' || includeDeletedParam === '1' || includeDeletedParam === 'yes';
    const includeSubscriptionParam = String(req.query?.includeSubscription || '').toLowerCase();
    const includeSubscription = includeSubscriptionParam === 'true' || includeSubscriptionParam === '1' || includeSubscriptionParam === 'yes';
    const professionals = await listProfessionals({ includeDeleted });
    if (!includeSubscription) {
      return res.json({ professionals: professionals.map(toProfessionalDTO) });
    }

    const professionalIds = professionals.map((professional) => professional._id);
    const latestSubs = await getLatestSubscriptionsForProfessionals(professionalIds);
    const subscriptionMap = new Map();
    latestSubs.forEach((sub) => {
      const key = sub.professional?.toString?.() || sub.professional?.toString();
      if (key && !subscriptionMap.has(key)) {
        subscriptionMap.set(key, sub);
      }
    });

    const payload = professionals.map((professional) => {
      const id = professional._id?.toString?.() || professional.id;
      return toProfessionalDTO(professional, subscriptionMap.get(id));
    });

    return res.json({ professionals: payload });
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
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'userId o username duplicado' });
    }
    return res.status(500).json({ error: 'No se pudo actualizar el profesional' });
  }
};

export const deleteProfessionalApi = async (req, res) => {
  try {
    const { id } = req.params;
    const forceParam = String(req.query?.force || req.body?.force || '').toLowerCase();
    const force = forceParam === 'true' || forceParam === '1' || forceParam === 'yes';
    const professional = force
      ? await getProfessionalByIdIncludingDeletedOrFail(id)
      : await getProfessionalByIdOrFail(id);
    if (!professional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const role = req.auth?.user?.role || req.context?.user?.role || null;

    if (force && role !== ROLES.SUPERADMIN) {
      return res.status(403).json({ error: 'No autorizado para eliminar definitivamente' });
    }

    await deleteProfessionalService(id, {
      force,
      deletedBy: req.auth?.user?.id || req.context?.user?.id || null
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo eliminar el profesional' });
  }
};

export const restoreProfessionalApi = async (req, res) => {
  try {
    const { id } = req.params;
    const professional = await getProfessionalByIdIncludingDeletedOrFail(id);
    if (!professional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    if (!professional.deletedAt) {
      return res.status(400).json({ error: 'El profesional ya esta activo' });
    }

    const restored = await restoreProfessionalService(id);
    return res.json({ professional: toProfessionalDTO(restored) });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo reactivar el profesional' });
  }
};

export const setProfessionalSubscriptionApi = async (req, res) => {
  try {
    const { id } = req.params;
    const professional = await getProfessionalByIdIncludingDeletedOrFail(id);
    if (!professional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const { plan, fin } = req.body || {};
    const normalizedPlan = plan === 'anual' ? 'anual' : 'mensual';
    let finDate = null;

    if (typeof fin === 'string' && fin.trim()) {
      const parsed = new Date(fin);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Fecha de finalizacion invalida' });
      }
      finDate = parsed;
    } else if (fin instanceof Date) {
      finDate = fin;
    }

    const subscription = await upsertActiveSubscription(id, {
      plan: normalizedPlan,
      status: 'activa',
      fin: finDate,
      createdBy: req.auth?.user?.id || req.context?.user?.id || null
    });

    return res.json({ subscription });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo actualizar la suscripcion' });
  }
};

export const resetProfessionalPasswordApi = async (req, res) => {
  try {
    const { id } = req.params;
    const { professional, password } = await resetProfessionalPasswordService(id);

    return res.json({
      professional: toProfessionalDTO(professional),
      newPassword: password,
      warning: 'La contrasena temporal se devuelve en esta respuesta. Guardala de forma segura.'
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      error: error.message || 'No se pudo restablecer la contrasena'
    });
  }
};

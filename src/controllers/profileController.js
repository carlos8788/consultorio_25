import mongoose from 'mongoose';
import { ROLES } from '../constants/roles.js';
import { getUserConfigs } from '../config/users.js';
import { getUserAccountById, updateUserAccountProfileFields } from '../repositories/userAccountRepository.js';
import { getProfessionalByIdOrFail, updateProfessionalService } from '../services/professionalService.js';

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value);

const buildProfilePayload = (body, fields) =>
  fields.reduce((acc, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      acc[field] = normalizeString(body[field]);
    }
    return acc;
  }, {});

const mapProfessionalProfile = (professional) => ({
  nombre: professional?.nombre || '',
  apellido: professional?.apellido || '',
  especialidad: professional?.especialidad || '',
  matricula: professional?.matricula || '',
  email: professional?.email || '',
  telefono: professional?.telefono || ''
});

const mapUserAccountProfile = (account) => ({
  nombre: account?.profile?.nombre || '',
  apellido: account?.profile?.apellido || '',
  email: account?.profile?.email || '',
  telefono: account?.profile?.telefono || ''
});

const mapStaticProfile = (config) => ({
  nombre: config?.profile?.nombre || '',
  apellido: config?.profile?.apellido || '',
  especialidad: config?.profile?.especialidad || '',
  matricula: config?.profile?.matricula || '',
  email: config?.profile?.email || '',
  telefono: config?.profile?.telefono || ''
});

const resolveStaticUserConfig = (authUser) => {
  const configs = getUserConfigs();
  return configs.find((entry) =>
    entry.id === authUser.id || entry.key === authUser.id || entry.key === authUser.username
  );
};

const buildUserSnapshot = (authUser) => ({
  id: authUser?.id || null,
  username: authUser?.username || null,
  role: authUser?.role || 'user',
  professionalId: authUser?.professionalId || null,
  professionalName: authUser?.professionalName || null
});

export const getProfileApi = async (req, res) => {
  try {
    const authUser = req.auth?.user;
    if (!authUser) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (authUser.role === ROLES.PROFESSIONAL && authUser.professionalId) {
      const professional = await getProfessionalByIdOrFail(authUser.professionalId);
      if (!professional) {
        return res.status(404).json({ error: 'Perfil profesional no encontrado' });
      }
      return res.json({
        user: buildUserSnapshot(authUser),
        profile: mapProfessionalProfile(professional),
        accountType: 'professional',
        editable: true
      });
    }

    if (mongoose.isValidObjectId(authUser.id)) {
      const account = await getUserAccountById(authUser.id);
      if (account) {
        return res.json({
          user: buildUserSnapshot(authUser),
          profile: mapUserAccountProfile(account),
          accountType: 'user',
          editable: true
        });
      }
    }

    const staticProfile = resolveStaticUserConfig(authUser);
    if (staticProfile) {
      return res.json({
        user: buildUserSnapshot(authUser),
        profile: mapStaticProfile(staticProfile),
        accountType: 'static',
        editable: false
      });
    }

    return res.status(404).json({ error: 'Perfil no encontrado' });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo cargar el perfil' });
  }
};

export const updateProfileApi = async (req, res) => {
  try {
    const authUser = req.auth?.user;
    if (!authUser) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (authUser.role === ROLES.PROFESSIONAL && authUser.professionalId) {
      const payload = buildProfilePayload(req.body || {}, [
        'nombre',
        'apellido',
        'especialidad',
        'matricula',
        'email',
        'telefono'
      ]);

      if (!Object.keys(payload).length) {
        return res.status(400).json({ error: 'No hay cambios para actualizar' });
      }

      const updated = await updateProfessionalService(authUser.professionalId, payload);
      if (!updated) {
        return res.status(404).json({ error: 'Perfil profesional no encontrado' });
      }

      return res.json({
        user: buildUserSnapshot(authUser),
        profile: mapProfessionalProfile(updated),
        accountType: 'professional',
        editable: true
      });
    }

    if (mongoose.isValidObjectId(authUser.id)) {
      const payload = buildProfilePayload(req.body || {}, [
        'nombre',
        'apellido',
        'email',
        'telefono'
      ]);

      if (!Object.keys(payload).length) {
        return res.status(400).json({ error: 'No hay cambios para actualizar' });
      }

      const updated = await updateUserAccountProfileFields(authUser.id, payload);
      if (!updated) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      return res.json({
        user: buildUserSnapshot(authUser),
        profile: mapUserAccountProfile(updated),
        accountType: 'user',
        editable: true
      });
    }

    return res.status(409).json({ error: 'Perfil no editable para este usuario' });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo actualizar el perfil' });
  }
};

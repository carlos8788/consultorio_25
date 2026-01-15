import {
  createUserAccount,
  listUserAccounts,
  findUserByUsername,
  getUserAccountById,
  updateUserAccountPassword
} from '../repositories/userAccountRepository.js';
import { hashPassword } from '../utils/passwordUtils.js';
import { generateRandomPassword } from '../utils/passwordUtils.js';
import { ROLES } from '../constants/roles.js';
import { getProfessionalByIdOrFail } from '../services/professionalService.js';

export const createUserApi = async (req, res) => {
  try {
    const { username, password, role, professionalId, nombre, apellido } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'username, password y role son obligatorios' });
    }
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ error: 'Role inválido' });
    }
    if (role === ROLES.PROFESSIONAL && !professionalId) {
      return res.status(400).json({ error: 'professionalId es obligatorio para profesionales' });
    }
    if (professionalId) {
      const professional = await getProfessionalByIdOrFail(professionalId);
      if (!professional) {
        return res.status(404).json({ error: 'Profesional no encontrado' });
      }
    }
    const exists = await findUserByUsername(username);
    if (exists) {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }
    const passwordHash = await hashPassword(password);
    const user = await createUserAccount({
      username,
      passwordHash,
      role,
      professional: professionalId || null,
      profile: { nombre, apellido },
      passwordUpdatedAt: new Date()
    });
    const safeUser = { ...user.toObject(), passwordHash: undefined };
    return res.status(201).json({ user: safeUser });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo crear el usuario' });
  }
};

export const listUsersApi = async (_req, res) => {
  try {
    const users = await listUserAccounts();
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudieron listar usuarios' });
  }
};

export const resetUserPasswordApi = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserAccountById(id, { includePassword: true });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const plainPassword = req.body?.password || generateRandomPassword(12);
    const passwordHash = await hashPassword(plainPassword);
    const updated = await updateUserAccountPassword(id, passwordHash);

    return res.json({
      user: updated,
      newPassword: plainPassword,
      warning: 'La contrasena temporal se devuelve en esta respuesta. Guardala de forma segura.'
    });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo restablecer la contrasena' });
  }
};

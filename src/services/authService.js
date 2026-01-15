import { resolveUsersFromEnv } from '../config/users.js';
import { authenticateProfessionalCredentials } from './professionalService.js';
import { findUserByUsername } from '../repositories/userAccountRepository.js';
import { verifyPassword } from '../utils/passwordUtils.js';
import { ROLES } from '../constants/roles.js';

const buildProfessionalSessionPayload = (professional) => ({
  id: professional.userId,
  username: professional.userId,
  role: ROLES.PROFESSIONAL,
  professionalId: professional._id.toString(),
  professionalName: `${professional.nombre || ''} ${professional.apellido || ''}`.trim()
});

export const authenticateUser = async ({ username, password }) => {
  const users = resolveUsersFromEnv();
  const validSuper = users.find((u) => u.role === ROLES.SUPERADMIN && u.username === username && u.password === password);
  if (validSuper) {
    return {
      user: validSuper,
      professional: null,
      sessionPayload: {
        id: validSuper.id,
        username: validSuper.username,
        role: validSuper.role,
        professionalId: null,
        professionalName: null
      }
    };
  }

  const validAdmin = users.find((u) => u.role === ROLES.ADMIN && u.username === username && u.password === password);
  if (validAdmin) {
    return {
      user: validAdmin,
      professional: null,
      sessionPayload: {
        id: validAdmin.id,
        username: validAdmin.username,
        role: validAdmin.role,
        professionalId: null,
        professionalName: null
      }
    };
  }

  // DB-backed accounts (assistant/professional/admin/superadmin extra)
  const dbUser = await findUserByUsername(username, { includePassword: true });
  if (dbUser && dbUser.passwordHash) {
    const ok = await verifyPassword(password, dbUser.passwordHash);
    if (ok) {
      return {
        user: {
          id: dbUser._id.toString(),
          username: dbUser.username,
          role: dbUser.role,
          professionalId: dbUser.professional ? dbUser.professional.toString() : null,
          professionalName: null
        },
        professional: null,
        sessionPayload: {
          id: dbUser._id.toString(),
          username: dbUser.username,
          role: dbUser.role,
          professionalId: dbUser.professional ? dbUser.professional.toString() : null,
          professionalName: null
        }
      };
    }
  }

  const professional = await authenticateProfessionalCredentials(username, password);
  if (!professional) {
    return null;
  }

  if (professional.passwordHash) {
    professional.passwordHash = undefined;
  }

  return {
    user: {
      id: professional.userId,
      username: professional.userId,
      role: ROLES.PROFESSIONAL
    },
    professional,
    sessionPayload: buildProfessionalSessionPayload(professional)
  };
};

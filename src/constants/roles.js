export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  PROFESSIONAL: 'professional',
  ASSISTANT: 'assistant'
};

export const isAdminRole = (role) => role === ROLES.ADMIN || role === ROLES.SUPERADMIN;

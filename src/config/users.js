const STATIC_USERS = [
  {
    key: 'admin',
    role: 'admin',
    id: 'admin',
    envUser: 'ADMIN_USER',
    envPassword: 'ADMIN_PASSWORD',
    profile: {
      nombre: 'Administrador',
      apellido: 'Principal'
    }
  },
  {
    key: 'meli',
    role: 'user',
    id: 'meli209',
    envUser: 'MELI_USER',
    envPassword: 'MELI_PASSWORD',
    assignLegacyRecords: true,
    profile: {
      nombre: 'Ana Melis',
      apellido: 'Gutierrez',
      especialidad: 'Odontología Integral'
    }
  }
];

export const getUserConfigs = () => STATIC_USERS;

export const resolveUsersFromEnv = () =>
  STATIC_USERS
    .map((user) => ({
      ...user,
      username: process.env[user.envUser],
      password: process.env[user.envPassword]
    }))
    .filter((user) => user.username && user.password);

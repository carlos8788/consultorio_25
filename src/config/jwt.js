const normalizeJwtDuration = (value, fallback) => {
  if (typeof value !== 'string') return fallback;
  const match = value.trim().match(/^(\d+)\s*([smhd])$/i);
  if (match) {
    return `${match[1]}${match[2].toLowerCase()}`;
  }

  const prefixMatch = value.trim().match(/^(\d+)\s*([smhd])/i);
  if (prefixMatch) {
    return `${prefixMatch[1]}${prefixMatch[2].toLowerCase()}`;
  }

  return fallback;
};

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
  expiresIn: normalizeJwtDuration(process.env.JWT_EXPIRES_IN, '12h'),
  rememberExpiresIn: normalizeJwtDuration(process.env.JWT_REMEMBER_EXPIRES_IN, '30d'),
  issuer: process.env.JWT_ISSUER || 'consultorio-app'
};

export const resolveJwtExpiresIn = (rememberMe = false) => (
  rememberMe ? jwtConfig.rememberExpiresIn : jwtConfig.expiresIn
);

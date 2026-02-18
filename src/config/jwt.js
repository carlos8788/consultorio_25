export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
  expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  rememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN || '30d',
  issuer: process.env.JWT_ISSUER || 'consultorio-app'
};

export const resolveJwtExpiresIn = (rememberMe = false) => (
  rememberMe ? jwtConfig.rememberExpiresIn : jwtConfig.expiresIn
);

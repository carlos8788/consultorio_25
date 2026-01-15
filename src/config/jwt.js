export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_me',
  expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  issuer: process.env.JWT_ISSUER || 'consultorio-app'
};

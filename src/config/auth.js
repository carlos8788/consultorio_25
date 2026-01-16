const isProduction = process.env.NODE_ENV === 'production';

const envSameSite = process.env.COOKIE_SAMESITE;
const defaultSameSite = (envSameSite || (isProduction ? 'none' : 'lax')).toLowerCase();
const secureFromEnv = process.env.COOKIE_SECURE;
const secure = typeof secureFromEnv === 'string'
  ? secureFromEnv.toLowerCase() === 'true'
  : isProduction;

export const authCookieConfig = {
  name: process.env.AUTH_COOKIE_NAME || 'consultorio_token',
  csrfName: process.env.CSRF_COOKIE_NAME || 'consultorio_csrf',
  domain: process.env.COOKIE_DOMAIN || undefined,
  sameSite: defaultSameSite,
  secure,
  path: '/'
};

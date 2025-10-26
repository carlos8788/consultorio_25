import crypto from 'crypto';

const HASH_DIGEST = 'sha512';
const HASH_ALGORITHM = 'pbkdf2';
const KEY_LENGTH = 64;
const DEFAULT_ITERATIONS = parseInt(process.env.PASSWORD_HASH_ITERATIONS || '150000', 10);
const PASSWORD_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789@#$%';

const pbkdf2 = (password, salt, iterations) =>
  new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, KEY_LENGTH, HASH_DIGEST, (err, derivedKey) => {
      if (err) {
        return reject(err);
      }
      resolve(derivedKey.toString('hex'));
    });
  });

export const hashPassword = async (password) => {
  if (!password) {
    throw new Error('La contraseña es requerida para generar el hash');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = DEFAULT_ITERATIONS;
  const hash = await pbkdf2(password, salt, iterations);
  return `${HASH_ALGORITHM}$${iterations}$${salt}$${hash}`;
};

export const verifyPassword = async (password, storedHash) => {
  if (!password || !storedHash) {
    return false;
  }

  const [algorithm, iterationsStr, salt, originalHash] = storedHash.split('$');

  if (algorithm !== HASH_ALGORITHM || !iterationsStr || !salt || !originalHash) {
    return false;
  }

  const iterations = parseInt(iterationsStr, 10);
  if (!Number.isFinite(iterations)) {
    return false;
  }

  const hashToCompare = await pbkdf2(password, salt, iterations);

  const hashBuffer = Buffer.from(originalHash, 'hex');
  const compareBuffer = Buffer.from(hashToCompare, 'hex');
  if (hashBuffer.length !== compareBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, compareBuffer);
};

export const generateRandomPassword = (length = 12) => {
  if (length <= 0) {
    throw new Error('El largo de la contraseña debe ser mayor a cero');
  }

  const charset = PASSWORD_CHARSET;
  const charsetLength = charset.length;
  let password = '';

  while (password.length < length) {
    const index = crypto.randomInt(0, charsetLength);
    password += charset[index];
  }

  return password;
};

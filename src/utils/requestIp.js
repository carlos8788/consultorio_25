import net from 'net';

const PRIVATE_IPV4_PREFIXES = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^0\./
];

const isPrivateIpv4 = (ip) => PRIVATE_IPV4_PREFIXES.some((pattern) => pattern.test(ip));

const isPrivateIpv6 = (ip) => {
  const normalized = ip.toLowerCase();
  if (normalized === '::' || normalized === '::1') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // unique local
  if (normalized.startsWith('fe80:')) return true; // link local
  if (normalized.startsWith('2001:db8:')) return true; // documentation range
  return false;
};

const stripIpv4MappedPrefix = (ip) => (ip.startsWith('::ffff:') ? ip.slice(7) : ip);

const stripPortIfPresent = (ip) => {
  if (!ip || net.isIP(ip)) return ip;
  const maybeIpv4 = ip.split(':')[0];
  return net.isIP(maybeIpv4) ? maybeIpv4 : ip;
};

export const normalizeIp = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  let ip = raw.trim();
  if (!ip) return null;
  ip = stripIpv4MappedPrefix(ip.toLowerCase());
  ip = stripPortIfPresent(ip);
  return ip;
};

export const isPublicIp = (raw) => {
  const ip = normalizeIp(raw);
  if (!ip) return false;
  const version = net.isIP(ip);
  if (version === 4) return !isPrivateIpv4(ip);
  if (version === 6) return !isPrivateIpv6(ip);
  return false;
};

export const getClientIp = (req) => {
  const ip = normalizeIp(req?.ip || '');
  return isPublicIp(ip) ? ip : null;
};

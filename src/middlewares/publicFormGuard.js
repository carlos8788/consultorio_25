import crypto from 'crypto';
import { logger } from '../logger/index.js';

const RATE_STORE = new Map();
const BACKOFF_STORE = new Map();
let lastCleanupAt = 0;

const DEFAULTS = {
  windowMs: Number(process.env.PUBLIC_FORM_RATE_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.PUBLIC_FORM_RATE_MAX) || 3,
  backoffBaseMs: Number(process.env.PUBLIC_FORM_BACKOFF_BASE_MS) || 60 * 1000,
  backoffMaxMs: Number(process.env.PUBLIC_FORM_BACKOFF_MAX_MS) || 60 * 60 * 1000,
  ipMaxMultiplier: Number(process.env.PUBLIC_FORM_IP_MAX_MULTIPLIER) || 3,
  maxKeys: Number(process.env.PUBLIC_FORM_MAX_KEYS) || 16,
  maxFieldLength: Number(process.env.PUBLIC_FORM_MAX_FIELD_LENGTH) || 3000,
  honeypotFields: ['website', 'honeypot', 'hp'],
  captchaProvider: process.env.PUBLIC_FORM_CAPTCHA_PROVIDER || 'turnstile',
  captchaSecret: process.env.PUBLIC_FORM_CAPTCHA_SECRET || '',
  captchaThreshold: Number(process.env.PUBLIC_FORM_CAPTCHA_THRESHOLD) || 1,
  requireCaptchaOnSuspicious: true
};

const isPlainObject = (value) => (
  value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype
);

const extractIp = (req) => {
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (typeof cfConnectingIp === 'string' && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return req.ip || null;
};

const getHeaderValue = (req, name) => {
  const value = req.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

const normalizeFingerprint = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 128);
};

const buildFingerprint = (req, ip, userAgent) => {
  const headerFingerprint = normalizeFingerprint(req.get('x-client-fingerprint'));
  const bodyFingerprint = normalizeFingerprint(req.body?.fingerprint);
  if (headerFingerprint) return headerFingerprint;
  if (bodyFingerprint) return bodyFingerprint;
  const acceptLanguage = getHeaderValue(req, 'accept-language');
  const seed = `${ip || 'unknown'}|${userAgent || 'unknown'}|${acceptLanguage || 'unknown'}`;
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return hash.slice(0, 32);
};

const buildClientKey = (ip, fingerprint) => `${ip || 'unknown'}:${fingerprint || 'unknown'}`;

const validatePayloadShape = (body, allowedFields, maxKeys, maxFieldLength) => {
  if (!isPlainObject(body)) {
    return 'Payload invalido';
  }

  const keys = Object.keys(body);
  if (keys.length === 0) {
    return 'Payload vacio';
  }
  if (keys.length > maxKeys) {
    return 'Demasiados campos en la solicitud';
  }

  for (const key of keys) {
    if (allowedFields && !allowedFields.has(key)) {
      return 'Payload invalido';
    }
    const value = body[key];
    if (value === null) {
      return 'Formato invalido';
    }
    if (Array.isArray(value) || isPlainObject(value)) {
      return 'Formato invalido';
    }
    if (value !== undefined && typeof value !== 'string') {
      return 'Formato invalido';
    }
    if (typeof value === 'string' && value.length > maxFieldLength) {
      return 'Campo demasiado largo';
    }
  }

  return null;
};

const getHoneypotHit = (body, fields) => {
  if (!isPlainObject(body)) return '';
  for (const field of fields) {
    const value = body[field];
    if (typeof value === 'string' && value.trim()) {
      return field;
    }
  }
  return '';
};

const cleanupStores = (now, windowMs) => {
  if (now - lastCleanupAt < 5 * 60 * 1000) return;
  lastCleanupAt = now;

  for (const [key, entry] of RATE_STORE.entries()) {
    if (entry.resetAt + windowMs < now) {
      RATE_STORE.delete(key);
    }
  }

  for (const [key, entry] of BACKOFF_STORE.entries()) {
    if (entry.blockedUntil + windowMs < now) {
      BACKOFF_STORE.delete(key);
    }
  }
};

const getRateEntry = (key, windowMs, now) => {
  const current = RATE_STORE.get(key);
  if (!current || current.resetAt <= now) {
    const entry = { count: 0, resetAt: now + windowMs };
    RATE_STORE.set(key, entry);
    return entry;
  }
  return current;
};

const applyBackoff = (key, config, now) => {
  const current = BACKOFF_STORE.get(key);
  const penalty = current?.penalty ? current.penalty + 1 : 0;
  const delay = Math.min(config.backoffBaseMs * Math.pow(2, penalty), config.backoffMaxMs);
  const blockedUntil = now + delay;
  BACKOFF_STORE.set(key, {
    penalty,
    blockedUntil,
    lastTriggered: now
  });
  return { blockedUntil, penalty, retryAfter: Math.ceil(delay / 1000) };
};

const checkRateLimit = (key, config) => {
  const now = Date.now();
  cleanupStores(now, config.windowMs);

  const backoff = BACKOFF_STORE.get(key);
  if (backoff && backoff.blockedUntil > now) {
    const retryAfter = Math.ceil((backoff.blockedUntil - now) / 1000);
    return { blocked: true, retryAfter, remaining: 0 };
  }

  const entry = getRateEntry(key, config.windowMs, now);
  entry.count += 1;
  const remaining = Math.max(config.max - entry.count, 0);

  if (entry.count > config.max) {
    const backoffState = applyBackoff(key, config, now);
    return { blocked: true, retryAfter: backoffState.retryAfter, remaining: 0 };
  }

  return {
    blocked: false,
    remaining,
    resetAt: entry.resetAt
  };
};

const isSuspiciousUserAgent = (userAgent) => (
  /(bot|crawler|spider|curl|wget|python|scrapy|headless|httpclient|go-http-client|java)/i.test(userAgent)
);

const getSuspiciousSignals = (req, rateInfo, ipRateInfo) => {
  const signals = [];
  const userAgent = getHeaderValue(req, 'user-agent');
  const acceptLanguage = getHeaderValue(req, 'accept-language');
  if (!acceptLanguage) {
    signals.push('missing_accept_language');
  }
  if (userAgent && isSuspiciousUserAgent(userAgent)) {
    signals.push('suspicious_user_agent');
  }
  if (rateInfo?.remaining !== undefined && rateInfo.remaining <= 1) {
    signals.push('rate_near_limit');
  }
  if (ipRateInfo?.remaining !== undefined && ipRateInfo.remaining <= 1) {
    signals.push('ip_rate_near_limit');
  }
  return signals;
};

const resolveCaptchaConfig = (config) => {
  const provider = (config.captchaProvider || '').toLowerCase();
  const secret = config.captchaSecret
    || (provider === 'hcaptcha' ? process.env.HCAPTCHA_SECRET_KEY : process.env.TURNSTILE_SECRET_KEY)
    || (provider === 'hcaptcha' ? process.env.HCAPTCHA_SECRET : process.env.TURNSTILE_SECRET)
    || '';
  return { provider, secret };
};

const readCaptchaToken = (req, provider) => {
  const token = req.body?.captchaToken
    || req.body?.['cf-turnstile-response']
    || req.body?.['h-captcha-response'];
  if (typeof token === 'string' && token.trim()) {
    return token.trim();
  }
  if (provider === 'turnstile') {
    const cfToken = req.body?.['cf-turnstile-response'];
    return typeof cfToken === 'string' ? cfToken.trim() : '';
  }
  if (provider === 'hcaptcha') {
    const hcToken = req.body?.['h-captcha-response'];
    return typeof hcToken === 'string' ? hcToken.trim() : '';
  }
  return '';
};

const verifyCaptcha = async (req, config, ip) => {
  const { provider, secret } = resolveCaptchaConfig(config);
  if (!provider) {
    return { success: false, message: 'Proveedor de captcha no configurado' };
  }
  if (!secret) {
    return { success: false, message: 'Captcha no configurado', provider };
  }
  if (typeof fetch !== 'function') {
    return { success: false, message: 'Captcha no disponible', provider };
  }

  const token = readCaptchaToken(req, provider);
  if (!token) {
    return { success: false, message: 'Captcha requerido', provider };
  }

  const endpoint = provider === 'hcaptcha'
    ? 'https://hcaptcha.com/siteverify'
    : 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  const payload = new URLSearchParams({
    secret,
    response: token
  });
  if (ip) {
    payload.append('remoteip', ip);
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: payload
    });
    const data = await response.json();
    if (data?.success) {
      return { success: true, provider };
    }
    return { success: false, message: 'Captcha invalido', provider, details: data };
  } catch (error) {
    logger.warn('[public-form] Error al verificar captcha', { error: error?.message });
    return { success: false, message: 'No se pudo verificar captcha', provider };
  }
};

export const createPublicFormGuard = (options = {}) => {
  const config = { ...DEFAULTS, ...options };
  const allowedFields = config.allowedFields ? new Set(config.allowedFields) : null;

  return async (req, res, next) => {
    const userAgent = getHeaderValue(req, 'user-agent');
    if (!userAgent) {
      return res.status(400).json({ error: 'User-Agent requerido' });
    }

    const ip = extractIp(req);
    const fingerprint = buildFingerprint(req, ip, userAgent);
    const clientKey = buildClientKey(ip, fingerprint);

    const payloadError = validatePayloadShape(req.body, allowedFields, config.maxKeys, config.maxFieldLength);
    if (payloadError) {
      return res.status(400).json({ error: payloadError });
    }

    const honeypotHit = getHoneypotHit(req.body, config.honeypotFields);
    if (honeypotHit) {
      logger.info('[public-form] Honeypot activado', { ip, field: honeypotHit });
      return res.status(400).json({ error: 'Solicitud invalida' });
    }

    const rateInfo = checkRateLimit(clientKey, config);
    const ipRateInfo = ip
      ? checkRateLimit(`ip:${ip}`, { ...config, max: Math.max(config.max * config.ipMaxMultiplier, config.max) })
      : null;

    if (rateInfo.blocked || ipRateInfo?.blocked) {
      const retryAfter = Math.max(rateInfo.retryAfter || 0, ipRateInfo?.retryAfter || 0, 60);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta mas tarde' });
    }

    const suspiciousSignals = getSuspiciousSignals(req, rateInfo, ipRateInfo);
    req.publicFormSecurity = {
      ip,
      fingerprint,
      clientKey,
      userAgent,
      suspiciousSignals
    };

    if (typeof config.checkDuplicate === 'function') {
      const duplicate = await config.checkDuplicate(req, req.publicFormSecurity);
      if (duplicate?.duplicate) {
        return res.status(409).json({ error: duplicate.message || 'Solicitud duplicada' });
      }
    }

    if (config.requireCaptchaOnSuspicious && suspiciousSignals.length >= config.captchaThreshold) {
      const captchaResult = await verifyCaptcha(req, config, ip);
      if (!captchaResult.success) {
        return res.status(403).json({
          error: captchaResult.message || 'Captcha requerido',
          captchaRequired: true,
          provider: captchaResult.provider || config.captchaProvider
        });
      }
    }

    return next();
  };
};

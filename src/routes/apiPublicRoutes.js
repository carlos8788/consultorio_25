import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { createDemoRequestValidator } from '../validators/demoRequestValidator.js';
import { createDemoRequestApi } from '../controllers/demoRequestController.js';
import { createIdeaRequestValidator } from '../validators/ideaRequestValidator.js';
import { createIdeaRequestApi } from '../controllers/ideaRequestController.js';
import { createPublicFormGuard } from '../middlewares/publicFormGuard.js';
import { countDemoRequests } from '../repositories/demoRequestRepository.js';
import { countIdeaRequests } from '../repositories/ideaRequestRepository.js';

const router = Router();

const DUPLICATE_WINDOW_MS = Number(process.env.PUBLIC_FORM_DUPLICATE_WINDOW_MS) || 10 * 60 * 1000;

const COMMON_FIELDS = [
  'website',
  'honeypot',
  'hp',
  'fingerprint',
  'captchaToken',
  'captchaProvider',
  'cf-turnstile-response',
  'h-captcha-response'
];

const DEMO_FIELDS = [
  'nombre',
  'email',
  'telefono',
  'centro',
  'mensaje',
  'intent',
  'source',
  ...COMMON_FIELDS
];

const IDEA_FIELDS = [
  'nombre',
  'email',
  'rol',
  'mensaje',
  'impacto',
  'source',
  ...COMMON_FIELDS
];

const buildLoosePhoneRegex = (phone) => {
  if (typeof phone !== 'string') return null;
  const digits = phone.replace(/\D+/g, '');
  if (digits.length < 6) return null;
  const pattern = digits.split('').join('\\D*');
  return new RegExp(`^\\D*${pattern}\\D*$`);
};

const checkDuplicateDemo = async (req) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const telefono = typeof req.body?.telefono === 'string' ? req.body.telefono.trim() : '';
  const filters = [];
  if (email) {
    filters.push({ email });
  }
  const phoneRegex = buildLoosePhoneRegex(telefono);
  if (phoneRegex) {
    filters.push({ telefono: phoneRegex });
  }
  if (!filters.length) return null;

  const windowStart = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const count = await countDemoRequests({
    createdAt: { $gte: windowStart },
    $or: filters
  });

  if (count > 0) {
    return { duplicate: true, message: 'Solicitud duplicada. Intenta mas tarde' };
  }
  return null;
};

const checkDuplicateIdea = async (req) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email) return null;
  const windowStart = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const count = await countIdeaRequests({ email, createdAt: { $gte: windowStart } });
  if (count > 0) {
    return { duplicate: true, message: 'Idea duplicada. Intenta mas tarde' };
  }
  return null;
};

const demoFormGuard = createPublicFormGuard({
  allowedFields: DEMO_FIELDS,
  checkDuplicate: checkDuplicateDemo
});

const ideaFormGuard = createPublicFormGuard({
  allowedFields: IDEA_FIELDS,
  checkDuplicate: checkDuplicateIdea
});

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post('/demo-requests', demoFormGuard, createDemoRequestValidator, validate, createDemoRequestApi);
router.post('/idea-requests', ideaFormGuard, createIdeaRequestValidator, validate, createIdeaRequestApi);

export default router;

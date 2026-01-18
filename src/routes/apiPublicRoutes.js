import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { createDemoRequestValidator } from '../validators/demoRequestValidator.js';
import { createDemoRequestApi } from '../controllers/demoRequestController.js';
import { createIdeaRequestValidator } from '../validators/ideaRequestValidator.js';
import { createIdeaRequestApi } from '../controllers/ideaRequestController.js';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post('/demo-requests', createDemoRequestValidator, validate, createDemoRequestApi);
router.post('/idea-requests', createIdeaRequestValidator, validate, createIdeaRequestApi);

export default router;

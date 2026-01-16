import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { createDemoRequestValidator } from '../validators/demoRequestValidator.js';
import { createDemoRequestApi } from '../controllers/demoRequestController.js';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post('/demo-requests', createDemoRequestValidator, validate, createDemoRequestApi);

export default router;

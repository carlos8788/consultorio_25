import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { createDemoRequestValidator } from '../validators/demoRequestValidator.js';
import { createDemoRequestApi } from '../controllers/demoRequestController.js';

const router = Router();

router.post('/demo-requests', createDemoRequestValidator, validate, createDemoRequestApi);

export default router;

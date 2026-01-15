import { Router } from 'express';
import { requireJwtAuth } from '../middlewares/jwtAuth.js';
import { requireActiveSubscription } from '../middlewares/subscriptionGuard.js';
import { validate } from '../middlewares/validate.js';
import {
  createInteresadoApi,
  listInteresadosApi,
  getInteresadoApi,
  updateInteresadoApi,
  deleteInteresadoApi
} from '../controllers/interesadoApiController.js';
import { createInteresadoValidator } from '../validators/interesadoValidator.js';

const router = Router();

router.use(requireJwtAuth, requireActiveSubscription);

router.get('/', listInteresadosApi);
router.post('/', createInteresadoValidator, validate, createInteresadoApi);
router.get('/:id', getInteresadoApi);
router.put('/:id', createInteresadoValidator, validate, updateInteresadoApi);
router.delete('/:id', deleteInteresadoApi);

export default router;

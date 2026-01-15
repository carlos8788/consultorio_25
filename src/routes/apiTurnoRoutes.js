import { Router } from 'express';
import { requireJwtAuth } from '../middlewares/jwtAuth.js';
import { requireActiveSubscription } from '../middlewares/subscriptionGuard.js';
import { validate } from '../middlewares/validate.js';
import {
  getTurnosApi,
  createTurnoApi,
  updateTurnoApi,
  deleteTurnoApi,
  createTurnosBulkApi
} from '../controllers/turnoApiController.js';
import {
  createTurnoValidator,
  updateTurnoValidator,
  createManyTurnosValidator
} from '../validators/turnoValidator.js';

const router = Router();

router.use(requireJwtAuth, requireActiveSubscription);

router.get('/', getTurnosApi);
router.post('/', createTurnoValidator, validate, createTurnoApi);
router.put('/:id', updateTurnoValidator, validate, updateTurnoApi);
router.delete('/:id', deleteTurnoApi);
router.post('/bulk', createManyTurnosValidator, validate, createTurnosBulkApi);

export default router;

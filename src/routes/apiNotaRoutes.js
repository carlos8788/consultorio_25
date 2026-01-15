import { Router } from 'express';
import { requireJwtAuth } from '../middlewares/jwtAuth.js';
import { requireActiveSubscription } from '../middlewares/subscriptionGuard.js';
import { validate } from '../middlewares/validate.js';
import {
  createNotaPacienteValidator,
  updateNotaPacienteValidator,
  listNotasPacienteValidator
} from '../validators/notaPacienteValidator.js';
import {
  listNotasGeneralApiV1,
  createNotaGeneralApiV1,
  updateNotaGeneralApiV1,
  deleteNotaGeneralApiV1
} from '../controllers/pacienteRestController.js';

const router = Router();

router.use(requireJwtAuth, requireActiveSubscription);

router.get('/', listNotasPacienteValidator, validate, listNotasGeneralApiV1);
router.post('/', createNotaPacienteValidator, validate, createNotaGeneralApiV1);
router.put('/:notaId', updateNotaPacienteValidator, validate, updateNotaGeneralApiV1);
router.delete('/:notaId', deleteNotaGeneralApiV1);

export default router;

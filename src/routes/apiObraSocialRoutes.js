import { Router } from 'express';
import { requireJwtAuth } from '../middlewares/jwtAuth.js';
import { requireActiveSubscription } from '../middlewares/subscriptionGuard.js';
import { validate } from '../middlewares/validate.js';
import {
  createObraSocialValidator,
  obraSocialEstadoValidator
} from '../validators/obraSocialValidator.js';
import {
  listObrasSocialesApi,
  createObraSocialApi,
  updateObraSocialEstadoApi
} from '../controllers/obraSocialApiController.js';

const router = Router();

// Todas las rutas de obras sociales en la API requieren JWT
// y una suscripción activa (se omite para roles admin/superadmin).
router.use(requireJwtAuth, requireActiveSubscription);

router.get('/', listObrasSocialesApi);
router.post('/', createObraSocialValidator, validate, createObraSocialApi);
router.patch('/:id/estado', obraSocialEstadoValidator, validate, updateObraSocialEstadoApi);

export default router;

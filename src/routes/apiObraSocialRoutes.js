import { Router } from 'express';
import { requireJwtAuth } from '../middlewares/jwtAuth.js';
import { requireActiveSubscription } from '../middlewares/subscriptionGuard.js';
import { listObrasSocialesApi } from '../controllers/obraSocialApiController.js';

const router = Router();

// Todas las rutas de obras sociales en la API requieren JWT
// y una suscripción activa (se omite para roles admin/superadmin).
router.use(requireJwtAuth, requireActiveSubscription);

router.get('/', listObrasSocialesApi);

export default router;

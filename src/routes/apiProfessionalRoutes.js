import { Router } from 'express';
import { requireJwtAuth } from '../middlewares/jwtAuth.js';
import { requireRole, ROLES } from '../middlewares/roleGuard.js';
import {
  listProfessionalsApi,
  createProfessionalApi,
  updateProfessionalApi,
  deleteProfessionalApi,
  restoreProfessionalApi,
  setProfessionalSubscriptionApi,
  resetProfessionalPasswordApi
} from '../controllers/professionalApiController.js';

const router = Router();

// Todas requieren JWT + rol admin/superadmin
router.use(requireJwtAuth, requireRole([ROLES.ADMIN, ROLES.SUPERADMIN]));

router.get('/', listProfessionalsApi);
router.post('/', createProfessionalApi);
router.put('/:id', updateProfessionalApi);
router.delete('/:id', deleteProfessionalApi);
router.post('/:id/restore', restoreProfessionalApi);
router.post('/:id/subscription', setProfessionalSubscriptionApi);
router.post('/:id/reset-password', resetProfessionalPasswordApi);

export default router;

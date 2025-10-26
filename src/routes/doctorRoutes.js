import { Router } from 'express';
import { isAuthenticated, requireAdmin } from '../middlewares/auth.js';
import {
  showDoctorAdminPanel,
  resetDoctorPasswordController
} from '../controllers/doctorAdminController.js';

const router = Router();

router.get('/admin/doctores', isAuthenticated, requireAdmin, showDoctorAdminPanel);
router.post('/admin/doctores/:doctorId/reset-password', isAuthenticated, requireAdmin, resetDoctorPasswordController);

export default router;

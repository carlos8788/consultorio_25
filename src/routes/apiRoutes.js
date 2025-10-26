import { Router } from 'express';
import { isAuthenticated, requireAdmin } from '../middlewares/auth.js';
import {
  getDoctorsForContext,
  setDoctorContext
} from '../controllers/adminContextController.js';

const router = Router();

router.get('/doctores', isAuthenticated, requireAdmin, getDoctorsForContext);
router.post('/context/doctor', isAuthenticated, requireAdmin, setDoctorContext);

export default router;

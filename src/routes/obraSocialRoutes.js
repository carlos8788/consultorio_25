import { Router } from 'express';
import {
  getAllObrasSociales,
  getObraSocialById,
  createObraSocial,
  updateObraSocial,
  deleteObraSocial
} from '../controllers/obraSocialController.js';
import { createObraSocialValidator, updateObraSocialValidator } from '../validators/obraSocialValidator.js';
import { validate } from '../middlewares/validate.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

router.get('/', getAllObrasSociales);
router.get('/:id', getObraSocialById);
router.post('/', createObraSocialValidator, validate, createObraSocial);
router.put('/:id', updateObraSocialValidator, validate, updateObraSocial);
router.delete('/:id', deleteObraSocial);

export default router;

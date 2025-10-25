import { Router } from 'express';
import {
  getAllTurnos,
  getTurnoById,
  createTurno,
  updateTurno,
  deleteTurno
} from '../controllers/turnoController.js';
import { createTurnoValidator, updateTurnoValidator } from '../validators/turnoValidator.js';
import { validate } from '../middlewares/validate.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

router.get('/', getAllTurnos);
router.get('/:id', getTurnoById);
router.post('/', createTurnoValidator, validate, createTurno);
router.put('/:id', updateTurnoValidator, validate, updateTurno);
router.delete('/:id', deleteTurno);

export default router;

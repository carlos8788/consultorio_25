import { Router } from 'express';
import {
  getAllPacientes,
  getPacienteById,
  createPaciente,
  updatePaciente,
  deletePaciente
} from '../controllers/pacienteController.js';
import { createPacienteValidator, updatePacienteValidator } from '../validators/pacienteValidator.js';
import { validate } from '../middlewares/validate.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

router.get('/', getAllPacientes);
router.get('/:id', getPacienteById);
router.post('/', createPacienteValidator, validate, createPaciente);
router.put('/:id', updatePacienteValidator, validate, updatePaciente);
router.delete('/:id', deletePaciente);

export default router;

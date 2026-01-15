import { Router } from 'express';
import { requireJwtAuth } from '../middlewares/jwtAuth.js';
import { requireActiveSubscription } from '../middlewares/subscriptionGuard.js';
import { validate } from '../middlewares/validate.js';
import {
  listPacientesApiV1,
  createPacienteApiV1,
  getPacienteApiV1,
  updatePacienteApiV1,
  deletePacienteApiV1,
  getPacienteStatsApiV1,
  listRecentAvisosApiV1,
  listAvisosApiV1,
  createAvisoApiV1,
  updateAvisoApiV1,
  deleteAvisoApiV1,
  searchPacientesApiV1,
  listNotasApiV1,
  createNotaApiV1,
  updateNotaApiV1,
  deleteNotaApiV1
} from '../controllers/pacienteRestController.js';
import { createPacienteValidator, updatePacienteValidator } from '../validators/pacienteValidator.js';
import {
  createNotaPacienteValidator,
  updateNotaPacienteValidator,
  listNotasPacienteValidator
} from '../validators/notaPacienteValidator.js';

const router = Router();

router.use(requireJwtAuth, requireActiveSubscription);

// Stats debe ir ANTES de /:id para que no se confunda "stats" con un ID
router.get('/stats/summary', getPacienteStatsApiV1);
router.get('/avisos/recent', listRecentAvisosApiV1);
router.get('/avisos', listAvisosApiV1);
router.post('/avisos', createAvisoApiV1);
router.put('/avisos/:id', updateAvisoApiV1);
router.delete('/avisos/:id', deleteAvisoApiV1);
router.get('/search', searchPacientesApiV1);

router.get('/', listPacientesApiV1);
router.post('/', createPacienteValidator, validate, createPacienteApiV1);
router.get('/:id', getPacienteApiV1);
router.get('/:id/notas', listNotasPacienteValidator, validate, listNotasApiV1);
router.post('/:id/notas', createNotaPacienteValidator, validate, createNotaApiV1);
router.put('/:id/notas/:notaId', updateNotaPacienteValidator, validate, updateNotaApiV1);
router.delete('/:id/notas/:notaId', deleteNotaApiV1);
router.put('/:id', updatePacienteValidator, validate, updatePacienteApiV1);
router.delete('/:id', deletePacienteApiV1);

export default router;

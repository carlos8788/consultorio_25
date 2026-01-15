import { Router } from 'express';
import { loginApi, meApi } from '../controllers/authApiController.js';
import professionalRoutes from './apiProfessionalRoutes.js';
import pacienteRoutes from './apiPacienteRoutes.js';
import turnoRoutes from './apiTurnoRoutes.js';
import interesadoRoutes from './apiInteresadoRoutes.js';
import { setProfessionalContext } from '../controllers/adminContextController.js';
import { requireJwtAuth } from '../middlewares/jwtAuth.js';
import { requireRole, ROLES } from '../middlewares/roleGuard.js';
import { createUserApi, listUsersApi } from '../controllers/userAdminController.js';
import obraSocialApiRoutes from './apiObraSocialRoutes.js';
import notaRoutes from './apiNotaRoutes.js';

const router = Router();

// Autenticación
router.post('/auth/login', loginApi);
router.get('/auth/me', requireJwtAuth, meApi);

// Contexto de profesional (admin/superadmin)
router.post(
  '/context/professional',
  requireJwtAuth,
  requireRole([ROLES.ADMIN, ROLES.SUPERADMIN]),
  setProfessionalContext
);

// Pacientes (API preparada para Next/React)
router.use('/pacientes', pacienteRoutes);

// Notas (generales o asociadas a paciente)
router.use('/notas', notaRoutes);

// Obras sociales (API)
router.use('/obras-sociales', obraSocialApiRoutes);

// Profesionales (CRUD admin)
router.use('/professionals', professionalRoutes);

// Turnos (API)
router.use('/turnos', turnoRoutes);

// Interesados (API)
router.use('/interesados', interesadoRoutes);

// Administración (solo superadmin)
router.post('/admin/users', requireJwtAuth, requireRole([ROLES.SUPERADMIN]), createUserApi);
router.get('/admin/users', requireJwtAuth, requireRole([ROLES.SUPERADMIN]), listUsersApi);

export default router;

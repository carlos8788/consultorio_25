import { Router } from 'express';
import { loginApi, logoutApi, meApi } from '../controllers/authApiController.js';
import publicRoutes from './apiPublicRoutes.js';
import professionalRoutes from './apiProfessionalRoutes.js';
import pacienteRoutes from './apiPacienteRoutes.js';
import turnoRoutes from './apiTurnoRoutes.js';
import interesadoRoutes from './apiInteresadoRoutes.js';
import profileRoutes from './apiProfileRoutes.js';
import configRoutes from './apiConfigRoutes.js';
import { setProfessionalContext } from '../controllers/adminContextController.js';
import { requireJwtAuth } from '../middlewares/jwtAuth.js';
import { requireRole, ROLES } from '../middlewares/roleGuard.js';
import { createUserApi, listUsersApi, resetUserPasswordApi } from '../controllers/userAdminController.js';
import obraSocialApiRoutes from './apiObraSocialRoutes.js';
import notaRoutes from './apiNotaRoutes.js';

const router = Router();

// Autenticacion
router.post('/auth/login', loginApi);
router.post('/auth/logout', logoutApi);
router.get('/auth/me', requireJwtAuth, meApi);

// Perfil usuario/profesional
router.use('/profile', profileRoutes);

// Configuracion del sistema
router.use('/config', configRoutes);

// Publico (landing, formularios)
router.use('/public', publicRoutes);

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

// Administracion (solo superadmin)
router.post('/admin/users', requireJwtAuth, requireRole([ROLES.SUPERADMIN]), createUserApi);
router.get('/admin/users', requireJwtAuth, requireRole([ROLES.ADMIN, ROLES.SUPERADMIN]), listUsersApi);
router.post('/admin/users/:id/reset-password', requireJwtAuth, requireRole([ROLES.ADMIN, ROLES.SUPERADMIN]), resetUserPasswordApi);

export default router;

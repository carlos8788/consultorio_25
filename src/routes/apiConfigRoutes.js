import { Router } from 'express';
import { getSystemConfigApi, updateSystemConfigApi } from '../controllers/systemConfigController.js';
import { requireJwtAuth } from '../middlewares/jwtAuth.js';
import { requireRole, ROLES } from '../middlewares/roleGuard.js';

const router = Router();

router.get('/', requireJwtAuth, getSystemConfigApi);
router.patch('/', requireJwtAuth, requireRole([ROLES.ADMIN, ROLES.SUPERADMIN]), updateSystemConfigApi);

export default router;

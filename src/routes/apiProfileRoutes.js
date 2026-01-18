import { Router } from 'express';
import { getProfileApi, updateProfileApi } from '../controllers/profileController.js';
import { requireJwtAuth } from '../middlewares/jwtAuth.js';

const router = Router();

router.get('/', requireJwtAuth, getProfileApi);
router.patch('/', requireJwtAuth, updateProfileApi);

export default router;

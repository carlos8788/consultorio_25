import { Router } from 'express';
import { showLanding, showLandingPublic } from '../controllers/landingController.js';

const router = Router();

router.get('/', showLanding);
router.get('/landing', showLandingPublic);

export default router;

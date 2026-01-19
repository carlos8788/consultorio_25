import { Router } from 'express';
import { requireJwtAuth } from '../middlewares/jwtAuth.js';
import { requireActiveSubscription } from '../middlewares/subscriptionGuard.js';
import { validate } from '../middlewares/validate.js';
import {
  listThreadsApi,
  getThreadApi,
  createThreadApi,
  replyThreadApi,
  markThreadReadApi,
  markThreadUnreadApi,
  deleteThreadApi,
  getUnreadCountApi,
  listRecipientsApi
} from '../controllers/messageThreadController.js';
import { createThreadValidator, replyThreadValidator } from '../validators/messageThreadValidator.js';

const router = Router();

router.use(requireJwtAuth, requireActiveSubscription);

router.get('/', listThreadsApi);
router.get('/unread-count', getUnreadCountApi);
router.get('/recipients', listRecipientsApi);
router.get('/:id', getThreadApi);
router.post('/', createThreadValidator, validate, createThreadApi);
router.post('/:id/reply', replyThreadValidator, validate, replyThreadApi);
router.post('/:id/read', markThreadReadApi);
router.post('/:id/unread', markThreadUnreadApi);
router.delete('/:id', deleteThreadApi);

export default router;

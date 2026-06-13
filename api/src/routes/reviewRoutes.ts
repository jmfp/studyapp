import { Router } from 'express';
import {
  startSession,
  submitReview,
  completeSession,
  getSessionHistory,
  getAnalytics,
} from '../controllers/reviewController';
import { protect } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(protect);

router.post('/topics/:topicId/sessions', startSession);
router.post('/sessions/:sessionId/reviews', submitReview);
router.post('/sessions/:sessionId/complete', completeSession);
router.get('/topics/:topicId/sessions', getSessionHistory);
router.get('/analytics', getAnalytics);

export default router;

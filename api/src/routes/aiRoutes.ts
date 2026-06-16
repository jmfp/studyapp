import { Router } from 'express';
import { getAiUsageStats, getAnalyticsInsights } from '../controllers/aiController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/usage', getAiUsageStats);
router.get('/insights', getAnalyticsInsights);

export default router;

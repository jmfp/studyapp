import { Router } from 'express';
import { getAiUsageStats } from '../controllers/aiController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/usage', getAiUsageStats);

export default router;

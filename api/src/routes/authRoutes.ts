import { Router } from 'express';
import { register, login, getMe, updateSubscription, deleteAccount } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/subscription', protect, updateSubscription);
router.delete('/me', protect, deleteAccount);

export default router;

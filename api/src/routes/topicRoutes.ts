import { Router } from 'express';
import { getTopics, getTopic, createTopic, updateTopic, deleteTopic } from '../controllers/topicController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getTopics);
router.get('/:id', getTopic);
router.post('/', createTopic);
router.put('/:id', updateTopic);
router.delete('/:id', deleteTopic);

export default router;

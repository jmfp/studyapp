import { Router } from 'express';
import { getCards, getCard, createCard, updateCard, deleteCard, getDueCards } from '../controllers/cardController';
import { generateCards, bulkCreateCards } from '../controllers/aiController';
import { protect } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(protect);

router.get('/', getCards);
router.get('/due', getDueCards);
router.post('/generate', generateCards);
router.post('/bulk', bulkCreateCards);
router.get('/:id', getCard);
router.post('/', createCard);
router.put('/:id', updateCard);
router.delete('/:id', deleteCard);

export default router;

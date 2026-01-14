import express from 'express';
import * as bankController from '../controllers/bank.controller.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only teachers and admins can access the bank
router.use(authenticate);
router.use(authorize(['TEACHER', 'ADMIN']));

router.get('/', bankController.getQuestions);
router.post('/', bankController.createQuestion);
router.delete('/:id', bankController.deleteQuestion);
router.post('/import', bankController.importToQuiz);

export default router;

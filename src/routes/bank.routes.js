import express from 'express';
import * as bankController from '../controllers/bank.controller.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only teachers and admins can access the bank
router.use(authenticate);
// Everyone authenticated can view, but only TEACHER/ADMIN can modify
router.get('/', authorize(['TEACHER', 'ADMIN', 'STUDENT']), bankController.getQuestions);
router.post('/', authorize(['TEACHER', 'ADMIN']), bankController.createQuestion);
router.delete('/:id', authorize(['TEACHER', 'ADMIN']), bankController.deleteQuestion);
router.post('/import', authorize(['TEACHER', 'ADMIN']), bankController.importToQuiz);

export default router;

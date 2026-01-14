import express from 'express';
import * as quizController from '../controllers/quiz.controller.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticate, authorize(['TEACHER', 'ADMIN']), quizController.createQuiz);
router.post('/:id/questions', authenticate, authorize(['TEACHER', 'ADMIN']), quizController.addQuestion);
router.get('/my-quizzes', authenticate, authorize(['TEACHER', 'ADMIN']), quizController.getMyQuizzes);
router.get('/results/me', authenticate, quizController.getMyResults); // Student results

router.get('/attempt/:id/review', authenticate, quizController.getAttemptReview); // Review attempt

router.get('/:id', authenticate, quizController.getQuiz);
router.patch('/:id', authenticate, authorize(['TEACHER', 'ADMIN']), quizController.updateQuiz);
router.delete('/:id', authenticate, authorize(['TEACHER', 'ADMIN']), quizController.deleteQuiz);

router.post('/:id/attempt', authenticate, quizController.startAttempt);
router.post('/submit', authenticate, quizController.submitAttempt);

// Teacher View Results
router.get('/:id/results', authenticate, authorize(['TEACHER', 'ADMIN']), quizController.getQuizResults);

export default router;

import express from 'express';
import * as qaController from '../controllers/qa.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (authenticated users)
router.get('/', authenticate, qaController.getQuestions);
router.get('/:id', authenticate, qaController.getQuestionById);

// Question routes
router.post('/', authenticate, qaController.createQuestion);
router.patch('/:id', authenticate, qaController.updateQuestion);
router.delete('/:id', authenticate, qaController.deleteQuestion);

// Answer routes
router.post('/:questionId/answers', authenticate, qaController.createAnswer);
router.patch('/answers/:id', authenticate, qaController.updateAnswer);
router.delete('/answers/:id', authenticate, qaController.deleteAnswer);

// Best answer (teacher only)
router.post('/:questionId/best-answer', authenticate, qaController.markBestAnswer);

// Voting
router.post('/:id/vote', authenticate, qaController.voteQuestion);
router.post('/answers/:id/vote', authenticate, qaController.voteAnswer);

export default router;

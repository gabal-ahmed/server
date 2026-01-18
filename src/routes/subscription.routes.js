import express from 'express';
import * as subController from '../controllers/subscription.controller.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/teachers', authenticate, authorize(['STUDENT']), subController.getAllTeachers); // Browse
router.get('/my-teachers', authenticate, authorize(['STUDENT']), subController.getMyTeachers); // My List

// New: Content Routes
router.get('/content/lessons', authenticate, authorize(['STUDENT']), subController.getSubscribedLessons);
router.get('/content/quizzes', authenticate, authorize(['STUDENT']), subController.getSubscribedQuizzes);

router.post('/subscribe', authenticate, authorize(['STUDENT']), subController.subscribe);
router.post('/unsubscribe', authenticate, authorize(['STUDENT']), subController.unsubscribe);

// Teacher: My Students
router.get('/my-students', authenticate, authorize(['TEACHER']), subController.getMyStudents);
router.get('/my-students/results', authenticate, authorize(['TEACHER']), subController.getMyStudentsResults);

// Teacher: Requests
router.get('/requests', authenticate, authorize(['TEACHER']), subController.getPendingRequests);
router.post('/approve', authenticate, authorize(['TEACHER']), subController.approveSubscription);
router.post('/reject', authenticate, authorize(['TEACHER']), subController.rejectSubscription);
router.post('/remove-student', authenticate, authorize(['TEACHER']), subController.removeStudent);

export default router;

import express from 'express';
import * as homeworkController from '../controllers/homework.controller.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

// List assignments (shared)
router.get('/', homeworkController.listAssignments);

// Teacher only: Create and Grade
router.post('/', authorize(['TEACHER', 'ADMIN']), homeworkController.createAssignment);
router.get('/:id/submissions', authorize(['TEACHER', 'ADMIN']), homeworkController.getSubmissions);
router.patch('/submissions/:id/grade', authorize(['TEACHER', 'ADMIN']), homeworkController.gradeWork);

// Student only: Submit and view personal history
router.post('/:id/submit', authorize(['STUDENT']), homeworkController.submitWork);
router.get('/my-submissions', authorize(['STUDENT']), homeworkController.getMySubmissions);

export default router;

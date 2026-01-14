import express from 'express';
import * as curriculumController from '../controllers/curriculum.controller.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Teacher Stats (Specific path before generic :id)
router.get('/stats', authenticate, authorize(['TEACHER', 'ADMIN']), curriculumController.getStats);

// Public read (or authenticated student)
router.get('/stages', curriculumController.getStages);
router.get('/subjects/:id', authenticate, curriculumController.getSubject); // Auth required for progress
router.get('/lessons/:id', authenticate, curriculumController.getLesson); // Protected content

// Progress
router.post('/lessons/:id/complete', authenticate, authorize(['STUDENT']), curriculumController.markComplete);

// Admin/Teacher write
router.post('/stages', authenticate, authorize(['ADMIN']), curriculumController.createStage);
router.post('/grades', authenticate, authorize(['ADMIN']), curriculumController.createGrade);
router.post('/subjects', authenticate, authorize(['ADMIN']), curriculumController.createSubject);
router.post('/units', authenticate, authorize(['ADMIN', 'TEACHER']), curriculumController.createUnit); // Teacher can add units? Maybe Admin only. Let's allow Teacher for flexibility.
router.post('/lessons', authenticate, authorize(['ADMIN', 'TEACHER']), curriculumController.createLesson);

export default router;

import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate, authorize(['ADMIN']));

router.get('/logs', adminController.getLogs);
router.get('/reports', adminController.getReports);

// User Approval Routes
router.get('/users/pending', adminController.getPendingUsers);
router.post('/users/:id/approve', adminController.approveUser);
router.post('/users/:id/reject', adminController.rejectUser);

export default router;

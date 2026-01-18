import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require ADMIN role
router.use(authenticate, authorize(['ADMIN']));

// Config
router.get('/banned-words', adminController.getBannedWords);
router.post('/banned-words', adminController.updateBannedWords);

// User Management
router.post('/block-user', adminController.blockUser);
router.post('/unblock-user', adminController.unblockUser);

// Pending Requests
router.get('/users/pending', adminController.getPendingUsers);
router.post('/users/:userId/approve', adminController.approveUser);
router.post('/users/:userId/reject', adminController.rejectUser);

// Content Moderation
router.get('/moderation-feed', adminController.getModerationFeed);
router.post('/delete-content', adminController.adminDeleteContent);

// System Logs
router.get('/logs', adminController.getLogs);

// System Reports
router.get('/reports', adminController.getSystemReports);

export default router;

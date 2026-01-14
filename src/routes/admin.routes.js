import express from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate, authorize(['ADMIN']));

router.get('/logs', adminController.getLogs);
router.get('/reports', adminController.getReports);

export default router;

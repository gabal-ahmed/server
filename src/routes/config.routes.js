import express from 'express';
import * as configController from '../controllers/config.controller.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, configController.getConfig);
router.patch('/', authenticate, authorize(['ADMIN']), configController.updateConfig);

export default router;

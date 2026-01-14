import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin Stats (must be before /:id to not conflict if using ID param, though specific paths take precedence)
router.get('/stats', authenticate, authorize(['ADMIN']), userController.getStats);

// Admin only: List and Delete users
router.get('/', authenticate, authorize(['ADMIN']), userController.getUsers);
router.delete('/:id', authenticate, authorize(['ADMIN']), userController.deleteUser);
router.patch('/:id/role', authenticate, authorize(['ADMIN']), userController.changeRole);

// Authenticated user: Update own profile
router.patch('/me', authenticate, userController.updateProfile);

export default router;

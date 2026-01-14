import * as userService from '../services/user.service.js';
import { logActivity } from '../services/admin.service.js';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  email: z.string().email().optional()
});

export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const result = await userService.getAllUsers({ page, limit, search });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    
    // Log Activity
    await logActivity({
      userId: req.user.id,
      action: 'DELETE_USER',
      details: { targetId: req.params.id },
      ip: req.ip
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['ADMIN', 'TEACHER', 'STUDENT'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const user = await userService.updateRole(req.params.id, role);
    
    // Log Activity
    await logActivity({
      userId: req.user.id,
      action: 'CHANGE_ROLE',
      details: { targetId: req.params.id, newRole: role },
      ip: req.ip
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const updatedUser = await userService.updateUser(req.user.id, data);
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await userService.getSystemStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

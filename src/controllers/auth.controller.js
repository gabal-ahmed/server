import * as authService from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../utils/validation.js';

export const register = async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Force role to STUDENT for public registration.
    // Teachers and Admins must be added/promoted by an existing Admin.
    const studentData = { ...data, role: 'STUDENT' };

    const result = await authService.register(studentData);
    res.status(201).json(result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.json(result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    res.status(401).json({ error: error.message });
  }
};

export const me = (req, res) => {
  // req.user is set by auth middleware
  res.json({ user: req.user });
};

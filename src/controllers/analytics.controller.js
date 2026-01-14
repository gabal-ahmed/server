import * as analyticsService from '../services/analytics.service.js';

export const getStats = async (req, res) => {
  try {
    if (req.user.role === 'STUDENT') {
      const stats = await analyticsService.getStudentAnalytics(req.user.id);
      return res.json(stats);
    } 
    
    if (req.user.role === 'TEACHER' || req.user.role === 'ADMIN') {
      const stats = await analyticsService.getTeacherAnalytics(req.user.id);
      return res.json(stats);
    }

    res.status(403).json({ error: 'Role not authorized for analytics' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

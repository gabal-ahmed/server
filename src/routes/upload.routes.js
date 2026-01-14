import express from 'express';
import upload from '../middleware/upload.middleware.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticate, authorize(['TEACHER', 'ADMIN', 'STUDENT']), upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return URL
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

export default router;

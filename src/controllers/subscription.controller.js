import * as subscriptionService from '../services/subscription.service.js';
import { z } from 'zod';

const subscribeSchema = z.object({
  teacherId: z.string()
});

export const subscribe = async (req, res) => {
  try {
    const { teacherId } = subscribeSchema.parse(req.body);
    await subscriptionService.subscribe(req.user.id, teacherId);
    res.json({ message: 'Subscribed successfully' });
  } catch (error) {
    // Unique constraint error might happen if already subscribed
    res.status(400).json({ error: 'Subscription failed (already subscribed?)' });
  }
};

export const unsubscribe = async (req, res) => {
  try {
    const { teacherId } = subscribeSchema.parse(req.body);
    await subscriptionService.unsubscribe(req.user.id, teacherId);
    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const approveSubscription = async (req, res) => {
  try {
    const { studentId } = req.body;
    await subscriptionService.approveSubscription(studentId, req.user.id);
    res.json({ message: 'Subscription approved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectSubscription = async (req, res) => {
  try {
    const { studentId } = req.body;
    await subscriptionService.rejectSubscription(studentId, req.user.id);
    res.json({ message: 'Subscription rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    // We can reuse unsubscribe or rejectSubscription since they do the same thing (delete)
    // But let's keep it semantic.
    await subscriptionService.unsubscribe(studentId, req.user.id);
    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const requests = await subscriptionService.getPendingRequests(req.user.id);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyTeachers = async (req, res) => {
  try {
    const subs = await subscriptionService.getMyTeachers(req.user.id);
    res.json(subs.map(s => s.teacher));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await subscriptionService.getAllTeachers(req.user.id);
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSubscribedLessons = async (req, res) => {
  try {
    const lessons = await subscriptionService.getSubscribedLessons(req.user.id);
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSubscribedQuizzes = async (req, res) => {
  try {
    const quizzes = await subscriptionService.getSubscribedQuizzes(req.user.id);
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Teacher Student Management
export const getMyStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const sort = req.query.sort || 'latest';
    const result = await subscriptionService.getMyStudents(req.user.id, { page, limit, search, sort });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyStudentsResults = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort || 'date_desc';
    const studentId = req.query.studentId || '';
    const quizId = req.query.quizId || '';

    const result = await subscriptionService.getMyStudentsResults(req.user.id, {
      page,
      limit,
      sort,
      studentId,
      quizId
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

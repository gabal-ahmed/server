import * as quizService from '../services/quiz.service.js';
import { z } from 'zod';

const createQuizSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  lessonId: z.string().optional(),
  questions: z.array(z.object({
    text: z.string(),
    type: z.enum(['MCQ', 'TRUE_FALSE']),
    points: z.number().default(1),
    options: z.array(z.object({
      text: z.string(),
      isCorrect: z.boolean()
    })).min(2)
  })).optional(),
  published: z.boolean().optional()
});

const addQuestionSchema = z.object({
  text: z.string(),
  type: z.enum(['MCQ', 'TRUE_FALSE']),
  points: z.number().default(1),
  options: z.array(z.object({
    text: z.string(),
    isCorrect: z.boolean()
  })).min(2)
});

const submitAttemptSchema = z.object({
  attemptId: z.string(),
  answers: z.array(z.object({
    questionId: z.string(),
    selectedOptionId: z.string().optional()
  }))
});

export const createQuiz = async (req, res) => {
  try {
    const data = createQuizSchema.parse(req.body);
    const quiz = await quizService.createQuiz({ ...data, teacherId: req.user.id });
    res.status(201).json(quiz);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const addQuestion = async (req, res) => {
  try {
    const data = addQuestionSchema.parse(req.body);
    const question = await quizService.addQuestion(req.params.id, data);
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getQuiz = async (req, res) => {
  try {
    let quiz;
    if (['TEACHER', 'ADMIN'].includes(req.user.role)) {
      quiz = await quizService.getQuizForTeacher(req.params.id);
    } else {
      quiz = await quizService.getQuiz(req.params.id);
    }

    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyQuizzes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const result = await quizService.getMyQuizzes(req.user.id, { page, limit, search });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    await quizService.deleteQuiz(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete" });
  }
};

const updateQuizSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  published: z.boolean().optional()
});

export const updateQuiz = async (req, res) => {
  try {
    const data = updateQuizSchema.parse(req.body);
    const quiz = await quizService.updateQuiz(req.params.id, data);
    res.json(quiz);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const startAttempt = async (req, res) => {
  try {
    const attempt = await quizService.startAttempt(req.user.id, req.params.id);
    res.json(attempt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const submitAttempt = async (req, res) => {
  try {
    const { attemptId, answers } = submitAttemptSchema.parse(req.body);
    const result = await quizService.submitAttempt(attemptId, answers);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyResults = async (req, res) => {
  try {
    const results = await quizService.getResults(req.user.id);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAttemptReview = async (req, res) => {
  try {
    const attempt = await quizService.getAttemptReview(req.user, req.params.id);
    res.json(attempt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getQuizResults = async (req, res) => {
  try {
    const results = await quizService.getQuizResults(req.params.id);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

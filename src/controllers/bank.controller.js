import * as bankService from '../services/bank.service.js';
import { z } from 'zod';

const createQuestionSchema = z.object({
  text: z.string().min(5),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  subjectId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  options: z.array(z.object({
    text: z.string().min(1),
    isCorrect: z.boolean()
  })).min(2)
});

export const getQuestions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { search, subjectId, unitId, difficulty } = req.query;

    const result = await bankService.getAllBankQuestions({ 
      page, limit, search, subjectId, unitId, difficulty 
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const data = createQuestionSchema.parse(req.body);
    const question = await bankService.createBankQuestion(req.user.id, data);
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    await bankService.deleteBankQuestion(req.params.id);
    res.json({ message: 'Question deleted from bank' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const importToQuiz = async (req, res) => {
  try {
    const { quizId, bankQuestionIds } = req.body;
    if (!quizId || !bankQuestionIds || !bankQuestionIds.length) {
      return res.status(400).json({ error: 'QuizId and bankQuestionIds are required' });
    }

    const questions = await bankService.importToQuiz(quizId, bankQuestionIds);
    res.json({ message: `${questions.length} questions imported successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

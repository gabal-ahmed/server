import * as homeworkService from '../services/homework.service.js';
import { z } from 'zod';

const assignmentSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  fileUrl: z.string().url().optional(),
  dueDate: z.string(),
  subjectId: z.string().uuid(),
  published: z.boolean().optional()
});

const submissionSchema = z.object({
  fileUrl: z.string().url(),
  content: z.string().optional()
});

const gradeSchema = z.object({
  score: z.number().min(0),
  feedback: z.string().optional()
});

export const listAssignments = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const assignments = await homeworkService.getAssignments(req.user.id, req.user.role, { subjectId });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAssignment = async (req, res) => {
  try {
    const data = assignmentSchema.parse(req.body);
    const assignment = await homeworkService.createAssignment(req.user.id, data);
    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const submitWork = async (req, res) => {
  try {
    const data = submissionSchema.parse(req.body);
    const submission = await homeworkService.submitAssignment(req.user.id, req.params.id, data);
    res.status(201).json(submission);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getSubmissions = async (req, res) => {
  try {
    const submissions = await homeworkService.getSubmissionsForAssignment(req.params.id);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const gradeWork = async (req, res) => {
  try {
    const data = gradeSchema.parse(req.body);
    const submission = await homeworkService.gradeSubmission(req.params.id, data);
    res.json(submission);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await homeworkService.getStudentSubmissions(req.user.id);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

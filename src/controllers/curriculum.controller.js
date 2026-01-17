import * as curriculumService from '../services/curriculum.service.js';
import { z } from 'zod';

const createStageSchema = z.object({ name: z.string() });
const createGradeSchema = z.object({ name: z.string(), stageId: z.string() });
const createSubjectSchema = z.object({ name: z.string(), gradeId: z.string() });
const createUnitSchema = z.object({ name: z.string(), subjectId: z.string() });
const createLessonSchema = z.object({
  title: z.string(),
  unitId: z.string(),
  content: z.string().optional(),
  videoUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  published: z.boolean().optional()
});

export const getStages = async (req, res) => {
  try {
    const stages = await curriculumService.getStages();
    res.json(stages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createStage = async (req, res) => {
  try {
    const { name } = createStageSchema.parse(req.body);
    const stage = await curriculumService.createStage(name);
    res.status(201).json(stage);
  } catch (error) {
    res.status(400).json({ error: error.message || error.errors });
  }
};

export const createGrade = async (req, res) => {
  try {
    const data = createGradeSchema.parse(req.body);
    const grade = await curriculumService.createGrade(data.name, data.stageId);
    res.status(201).json(grade);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createSubject = async (req, res) => {
  try {
    const data = createSubjectSchema.parse(req.body);
    const subject = await curriculumService.createSubject(data.name, data.gradeId);
    res.status(201).json(subject);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createUnit = async (req, res) => {
  try {
    const data = createUnitSchema.parse(req.body);
    const unit = await curriculumService.createUnit(data.name, data.subjectId);
    res.status(201).json(unit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getSubject = async (req, res) => {
  try {
    // Optional: if public route, req.user might be undefined.
    // Ensure auth middleware populates req.user if present, or handle unauth.
    // If not authenticated, they just see no progress.
    const userId = req.user?.id;
    const subject = await curriculumService.getSubject(req.params.id, userId);

    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json(subject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createLesson = async (req, res) => {
  try {
    const data = createLessonSchema.parse(req.body);
    // teacherId from req.user
    const lesson = await curriculumService.createLesson({ ...data, teacherId: req.user.id });
    res.status(201).json(lesson);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getLesson = async (req, res) => {
  try {
    // Pass user ID to check progress
    const lesson = await curriculumService.getLesson(req.params.id, req.user?.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getLessons = async (req, res) => {
  try {
    const lessons = await curriculumService.getLessons();
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markComplete = async (req, res) => {
  try {
    await curriculumService.markLessonComplete(req.user.id, req.params.id);
    res.json({ message: 'Marked as complete' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await curriculumService.getTeacherStats(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

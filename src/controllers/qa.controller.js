import * as qaService from '../services/qa.service.js';

export const getQuestions = async (req, res) => {
    try {
        const result = await qaService.getQuestions(req.query);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const question = await qaService.getQuestionById(id, userId);
        
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        
        res.json(question);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createQuestion = async (req, res) => {
    try {
        const { title, content, lessonId, subjectId } = req.body;
        const authorId = req.user.id;

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const question = await qaService.createQuestion({
            title: title.trim(),
            content: content.trim(),
            lessonId: lessonId || null,
            subjectId: subjectId || null,
            authorId
        });

        res.status(201).json(question);
    } catch (error) {
        console.error('Error creating question:', error);
        res.status(400).json({ error: error.message || 'Failed to create question' });
    }
};

export const updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const authorId = req.user.id;

        const question = await qaService.updateQuestion(id, { title, content }, authorId);
        res.json(question);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const authorId = req.user.id;

        await qaService.deleteQuestion(id, authorId);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const createAnswer = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { content } = req.body;
        const authorId = req.user.id;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const answer = await qaService.createAnswer({
            content,
            questionId,
            authorId
        });

        res.status(201).json(answer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateAnswer = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const authorId = req.user.id;

        const answer = await qaService.updateAnswer(id, { content }, authorId);
        res.json(answer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteAnswer = async (req, res) => {
    try {
        const { id } = req.params;
        const authorId = req.user.id;

        await qaService.deleteAnswer(id, authorId);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const markBestAnswer = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { answerId } = req.body;
        const teacherId = req.user.id;

        const question = await qaService.markBestAnswer(questionId, answerId, teacherId);
        res.json(question);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const voteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { isUpvote } = req.body;
        const userId = req.user.id;

        const question = await qaService.voteQuestion(id, userId, isUpvote === true);
        res.json(question);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const voteAnswer = async (req, res) => {
    try {
        const { id } = req.params;
        const { isUpvote } = req.body;
        const userId = req.user.id;

        const question = await qaService.voteAnswer(id, userId, isUpvote === true);
        res.json(question);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

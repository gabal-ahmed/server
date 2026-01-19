import prisma from '../prisma.js';
import { createNotification } from './notification.service.js';

// Get all questions with filters
export const getQuestions = async (params = {}) => {
    const {
        lessonId,
        subjectId,
        authorId,
        search,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = params;

    const skip = (page - 1) * limit;
    const where = {
        isDeleted: false,
        ...(lessonId && { lessonId }),
        ...(subjectId && { subjectId }),
        ...(authorId && { authorId }),
        ...(search && {
            OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } }
            ]
        })
    };

    const [questions, total] = await Promise.all([
        prisma.questionQA.findMany({
            where,
            skip,
            take: Number(limit),
            include: {
                author: {
                    select: { id: true, name: true, role: true }
                },
                lesson: {
                    select: { id: true, title: true }
                },
                subject: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: {
                        answers: { where: { isDeleted: false } },
                        votes: true
                    }
                },
                votes: {
                    select: {
                        userId: true,
                        isUpvote: true
                    }
                },
                bestAnswer: {
                    include: {
                        author: {
                            select: { id: true, name: true, role: true }
                        },
                        _count: {
                            select: {
                                votes: true
                            }
                        }
                    }
                }
            },
            orderBy: { [sortBy]: sortOrder }
        }),
        prisma.questionQA.count({ where })
    ]);

    // Calculate vote scores for each question
    const questionsWithScores = questions.map(q => {
        const upvotes = q.votes.filter(v => v.isUpvote).length;
        const downvotes = q.votes.filter(v => !v.isUpvote).length;
        return {
            ...q,
            voteScore: upvotes - downvotes,
            upvotes,
            downvotes
        };
    });

    return {
        questions: questionsWithScores,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

// Get single question with answers
export const getQuestionById = async (questionId, userId = null) => {
    const question = await prisma.questionQA.findUnique({
        where: { id: questionId, isDeleted: false },
        include: {
            author: {
                select: { id: true, name: true, role: true }
            },
            lesson: {
                select: { id: true, title: true }
            },
            subject: {
                select: { id: true, name: true }
            },
            answers: {
                where: { isDeleted: false },
                include: {
                    author: {
                        select: { id: true, name: true, role: true }
                    },
                    _count: {
                        select: {
                            votes: true
                        }
                    },
                    votes: userId ? {
                        where: { userId }
                    } : false
                },
                orderBy: [
                    { isBestAnswer: 'desc' },
                    { createdAt: 'asc' }
                ]
            },
            _count: {
                select: {
                    answers: { where: { isDeleted: false } },
                    votes: true
                }
            },
            votes: userId ? {
                where: { userId }
            } : []
        }
    });

    if (!question) return null;

    // Calculate vote scores
    const upvotes = question.votes.filter(v => v.isUpvote).length;
    const downvotes = question.votes.filter(v => !v.isUpvote).length;
    const userVote = question.votes[0] || null;

    const answersWithScores = question.answers.map(a => {
        const answerUpvotes = a.votes.filter(v => v.isUpvote).length;
        const answerDownvotes = a.votes.filter(v => !v.isUpvote).length;
        return {
            ...a,
            voteScore: answerUpvotes - answerDownvotes,
            upvotes: answerUpvotes,
            downvotes: answerDownvotes,
            userVote: a.votes[0] || null
        };
    });

    return {
        ...question,
        voteScore: upvotes - downvotes,
        upvotes,
        downvotes,
        userVote,
        answers: answersWithScores
    };
};

// Helper to check for banned words
const checkContent = async (text) => {
    const config = await prisma.systemConfig.findUnique({ where: { id: 'singleton' } });
    const bannedWords = config?.bannedWords || [];

    if (bannedWords.length === 0) return;

    // Split text by delimiters (spaces, punctuation, newlines)
    // This allows for "word" matching instead of "substring" matching
    const wordsInText = text.toLowerCase().split(/[\s\n\r\t.,!?;:()\[\]"']+/);

    for (const banned of bannedWords) {
        if (wordsInText.includes(banned.toLowerCase())) {
            throw new Error(`Content contains banned word: ${banned}`);
        }
    }
};

// Create question
export const createQuestion = async (data) => {
    const { title, content, lessonId, subjectId, authorId } = data;

    await checkContent(title + ' ' + content);

    // Clean up empty strings - convert to null
    const cleanLessonId = lessonId && lessonId.trim() !== '' ? lessonId : null;
    const cleanSubjectId = subjectId && subjectId.trim() !== '' ? subjectId : null;

    // Allow questions without lesson or subject (general questions)
    // if (!cleanLessonId && !cleanSubjectId) {
    //     throw new Error('Question must be associated with either a lesson or subject');
    // }

    const question = await prisma.questionQA.create({
        data: {
            title,
            content,
            lessonId: cleanLessonId,
            subjectId: cleanSubjectId,
            authorId
        },
        include: {
            author: {
                select: { id: true, name: true, role: true }
            },
            lesson: {
                select: { id: true, title: true, teacherId: true }
            },
            subject: {
                select: { id: true, name: true }
            }
        }
    });

    // Notify Teacher if lesson question
    if (question.lesson?.teacherId && question.authorId !== question.lesson.teacherId) {
        await createNotification(question.lesson.teacherId, {
            title: 'New Question',
            message: `${question.author.name} asked a question in ${question.lesson.title}`,
            type: 'QA',
            link: `/student/qa`
        });
    }

    return question;
};

// Update question
export const updateQuestion = async (questionId, data, authorId) => {
    const question = await prisma.questionQA.findUnique({
        where: { id: questionId }
    });

    if (!question) {
        throw new Error('Question not found');
    }

    if (question.authorId !== authorId) {
        throw new Error('You can only edit your own questions');
    }

    await checkContent(data.title + ' ' + data.content);

    return prisma.questionQA.update({
        where: { id: questionId },
        data: {
            title: data.title,
            content: data.content,
            updatedAt: new Date()
        },
        include: {
            author: {
                select: { id: true, name: true, role: true }
            }
        }
    });
};

// Delete question (soft delete)
export const deleteQuestion = async (questionId, authorId) => {
    const question = await prisma.questionQA.findUnique({
        where: { id: questionId }
    });

    if (!question) {
        throw new Error('Question not found');
    }

    if (question.authorId !== authorId) {
        throw new Error('You can only delete your own questions');
    }

    return prisma.questionQA.update({
        where: { id: questionId },
        data: { isDeleted: true }
    });
};

// Create answer
export const createAnswer = async (data) => {
    const { content, questionId, authorId } = data;

    await checkContent(content);

    // Verify question exists
    const question = await prisma.questionQA.findUnique({
        where: { id: questionId, isDeleted: false }
    });

    if (!question) {
        throw new Error('Question not found');
    }

    const answer = await prisma.answerQA.create({
        data: {
            content,
            questionId,
            authorId
        },
        include: {
            author: {
                select: { id: true, name: true, role: true }
            },
            question: {
                select: { id: true, title: true, authorId: true }
            }
        }
    });

    // Notify Question Author
    if (answer.question.authorId !== answer.authorId) {
        await createNotification(answer.question.authorId, {
            title: 'New Answer',
            message: `${answer.author.name} replied to your question: ${answer.question.title}`,
            type: 'QA',
            link: `/student/qa`
        });
    }

    return answer;
};

// Update answer
export const updateAnswer = async (answerId, data, authorId) => {
    const answer = await prisma.answerQA.findUnique({
        where: { id: answerId }
    });

    if (!answer) {
        throw new Error('Answer not found');
    }

    if (answer.authorId !== authorId) {
        throw new Error('You can only edit your own answers');
    }

    await checkContent(data.content);

    return prisma.answerQA.update({
        where: { id: answerId },
        data: {
            content: data.content,
            updatedAt: new Date()
        },
        include: {
            author: {
                select: { id: true, name: true, role: true }
            }
        }
    });
};

// Delete answer (soft delete)
export const deleteAnswer = async (answerId, authorId) => {
    const answer = await prisma.answerQA.findUnique({
        where: { id: answerId }
    });

    if (!answer) {
        throw new Error('Answer not found');
    }

    if (answer.authorId !== authorId) {
        throw new Error('You can only delete your own answers');
    }

    return prisma.answerQA.update({
        where: { id: answerId },
        data: { isDeleted: true }
    });
};

// Mark best answer (teacher only)
export const markBestAnswer = async (questionId, answerId, teacherId) => {
    const question = await prisma.questionQA.findUnique({
        where: { id: questionId },
        include: {
            lesson: true
        }
    });

    if (!question) {
        throw new Error('Question not found');
    }

    // Check if user is the teacher of the lesson
    if (question.lesson && question.lesson.teacherId !== teacherId) {
        throw new Error('Only the lesson teacher can mark best answer');
    }

    // If answerId is provided, mark it as best
    if (answerId) {
        const answer = await prisma.answerQA.findUnique({
            where: { id: answerId }
        });

        if (!answer || answer.questionId !== questionId) {
            throw new Error('Answer not found or does not belong to this question');
        }

        // Update question
        await prisma.questionQA.update({
            where: { id: questionId },
            data: {
                bestAnswerId: answerId,
                isResolved: true
            }
        });

        // Update answer
        await prisma.answerQA.update({
            where: { id: answerId },
            data: { isBestAnswer: true }
        });

        // Unmark previous best answer if exists
        if (question.bestAnswerId && question.bestAnswerId !== answerId) {
            await prisma.answerQA.update({
                where: { id: question.bestAnswerId },
                data: { isBestAnswer: false }
            });
        }
    } else {
        // Remove best answer
        if (question.bestAnswerId) {
            await prisma.answerQA.update({
                where: { id: question.bestAnswerId },
                data: { isBestAnswer: false }
            });
        }

        await prisma.questionQA.update({
            where: { id: questionId },
            data: {
                bestAnswerId: null,
                isResolved: false
            }
        });
    }

    return getQuestionById(questionId);
};

// Vote on question
export const voteQuestion = async (questionId, userId, isUpvote) => {
    const existingVote = await prisma.questionVote.findUnique({
        where: {
            questionId_userId: {
                questionId,
                userId
            }
        }
    });

    if (existingVote) {
        if (existingVote.isUpvote === isUpvote) {
            // Remove vote if clicking same vote type
            await prisma.questionVote.delete({
                where: {
                    questionId_userId: {
                        questionId,
                        userId
                    }
                }
            });
        } else {
            // Update vote
            await prisma.questionVote.update({
                where: {
                    questionId_userId: {
                        questionId,
                        userId
                    }
                },
                data: { isUpvote }
            });
        }
    } else {
        // Create new vote
        await prisma.questionVote.create({
            data: {
                questionId,
                userId,
                isUpvote
            }
        });
    }

    return getQuestionById(questionId, userId);
};

// Vote on answer
export const voteAnswer = async (answerId, userId, isUpvote) => {
    const existingVote = await prisma.answerVote.findUnique({
        where: {
            answerId_userId: {
                answerId,
                userId
            }
        }
    });

    if (existingVote) {
        if (existingVote.isUpvote === isUpvote) {
            // Remove vote if clicking same vote type
            await prisma.answerVote.delete({
                where: {
                    answerId_userId: {
                        answerId,
                        userId
                    }
                }
            });
        } else {
            // Update vote
            await prisma.answerVote.update({
                where: {
                    answerId_userId: {
                        answerId,
                        userId
                    }
                },
                data: { isUpvote }
            });
        }
    } else {
        // Create new vote
        await prisma.answerVote.create({
            data: {
                answerId,
                userId,
                isUpvote
            }
        });
    }

    const answer = await prisma.answerQA.findUnique({
        where: { id: answerId },
        include: {
            question: true
        }
    });

    return getQuestionById(answer.questionId, userId);
};

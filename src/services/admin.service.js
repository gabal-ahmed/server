import prisma from '../prisma.js';

export const getSystemConfig = async () => {
    let config = await prisma.systemConfig.findUnique({ where: { id: 'singleton' } });
    if (!config) {
        config = await prisma.systemConfig.create({
            data: { id: 'singleton' }
        });
    }
    return config;
};

export const updateBannedWords = async (words) => {
    return prisma.systemConfig.update({
        where: { id: 'singleton' },
        data: { bannedWords: words }
    });
};

export const toggleUserBlock = async (userId, isBlocked) => {
    return prisma.user.update({
        where: { id: userId },
        data: { isBlocked }
    });
};

export const getRecentQA = async ({ page = 1, limit = 20, search = '' }) => {
    const skip = (page - 1) * limit;

    // Fetch questions and answers mixed? Or just questions for now.
    // Let's just fetch questions for simplicity of moderation feed.
    const where = {
        isDeleted: false,
        ...(search && {
            OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
                { author: { name: { contains: search, mode: 'insensitive' } } }
            ]
        })
    };

    const [questions, total] = await Promise.all([
        prisma.questionQA.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
            include: {
                author: { select: { id: true, name: true, email: true, isBlocked: true } },
                _count: { select: { answers: true } }
            }
        }),
        prisma.questionQA.count({ where })
    ]);

    return { questions, total, pages: Math.ceil(total / limit) };
};

export const deleteContentAsAdmin = async (type, id) => {
    if (type === 'question') {
        return prisma.questionQA.update({ where: { id }, data: { isDeleted: true } });
    } else if (type === 'answer') {
        return prisma.answerQA.update({ where: { id }, data: { isDeleted: true } });
    }
};

export const getLogs = async ({ page = 1, limit = 20, search = '' }) => {
    const skip = (page - 1) * limit;
    const where = {
        ...(search && {
            OR: [
                { action: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } }
                // details might be JSON so search might be tricky, skip for now or cast?
            ]
        })
    };

    const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
            where,
            skip,
            take: Number(limit),
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, name: true, role: true } } }
        }),
        prisma.activityLog.count({ where })
    ]);

    return { logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const logActivity = async ({ userId, action, details = null, ip = null }) => {
    return prisma.activityLog.create({
        data: {
            userId,
            action,
            details: details ? JSON.stringify(details) : null,
            ip
        }
    });
};

export const getPendingUsers = async () => {
    return prisma.user.findMany({
        where: { isActive: false, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
};

export const approveUser = async (userId) => {
    return prisma.user.update({
        where: { id: userId },
        data: { isActive: true }
    });
};

export const rejectUser = async (userId) => {
    // Hard delete or soft delete? Let's do soft delete for now or hard delete if they are just pending.
    // Usually rejected requests are deleted.
    return prisma.user.delete({
        where: { id: userId }
    });
};

export const getSystemReports = async () => {
    // Get user counts by role
    const users = await prisma.user.groupBy({
        by: ['role'],
        _count: true,
        where: { isDeleted: false }
    });

    const usersByRole = {
        STUDENT: 0,
        TEACHER: 0,
        ADMIN: 0
    };

    users.forEach(u => {
        usersByRole[u.role] = u._count;
    });

    // Get content counts
    const [lessonsCount, quizzesCount] = await Promise.all([
        prisma.lesson.count({ where: { isDeleted: false } }),
        prisma.quiz.count({ where: { isDeleted: false } })
    ]);

    return {
        usersByRole,
        totalContent: {
            lessons: lessonsCount,
            quizzes: quizzesCount
        }
    };
};

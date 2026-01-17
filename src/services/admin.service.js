import prisma from '../prisma.js';
import { notifyUserOfApproval, notifyUserOfRejection } from '../utils/email.js';

export const logActivity = async (data) => {
    return prisma.activityLog.create({
        data: {
            userId: data.userId,
            action: data.action,
            details: data.details ? JSON.stringify(data.details) : null,
            ip: data.ip
        }
    });
};

export const getActivityLogs = async (params = {}) => {
    const { page = 1, limit = 20, search = '' } = params;
    const skip = (page - 1) * limit;

    const where = search ? {
        OR: [
            { action: { contains: search } },
            { user: { name: { contains: search } } }
        ]
    } : {};

    const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
            where,
            skip,
            take: Number(limit),
            include: {
                user: { select: { id: true, name: true, role: true } }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.activityLog.count({ where })
    ]);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

export const getGlobalReports = async () => {
    const [userStats, contentStats, lessonStats] = await Promise.all([
        prisma.user.groupBy({
            by: ['role'],
            _count: { _all: true }
        }),
        prisma.lesson.count({ where: { isDeleted: false } }),
        prisma.quiz.count({ where: { isDeleted: false } })
    ]);

    // Format role stats
    const roles = {
        STUDENT: userStats.find(s => s.role === 'STUDENT')?._count._all || 0,
        TEACHER: userStats.find(s => s.role === 'TEACHER')?._count._all || 0,
        ADMIN: userStats.find(s => s.role === 'ADMIN')?._count._all || 0
    };

    return {
        usersByRole: roles,
        totalContent: {
            lessons: contentStats,
            quizzes: lessonStats
        },
        systemHealth: "OK"
    };
};

export const getPendingUsers = async () => {
    const users = await prisma.user.findMany({
        where: { 
            isActive: false, 
            isDeleted: false 
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${users.length} pending users`);
    return users;
};

export const approveUser = async (userId) => {
    const user = await prisma.user.update({
        where: { id: userId },
        data: { isActive: true }
    });

    // Notify user of approval
    notifyUserOfApproval(user).catch(console.error);

    return user;
};

export const rejectUser = async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user) {
        await prisma.user.delete({ where: { id: userId } });
        // Notify user of rejection
        notifyUserOfRejection(user.email, user.name).catch(console.error);
    }

    return { success: true };
};

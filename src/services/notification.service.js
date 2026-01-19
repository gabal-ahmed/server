import prisma from '../prisma.js';

export const createNotification = async (userId, data) => {
    const { title, message, type, link } = data;
    return prisma.notification.create({
        data: {
            userId,
            title,
            message,
            type,
            link
        }
    });
};

export const getUserNotifications = async (userId) => {
    return prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20
    });
};

export const markAsRead = async (userId, notificationId) => {
    return prisma.notification.update({
        where: { id: notificationId, userId },
        data: { isRead: true }
    });
};

export const markAllAsRead = async (userId) => {
    return prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
    });
};

export const getUnreadCount = async (userId) => {
    return prisma.notification.count({
        where: { userId, isRead: false }
    });
};

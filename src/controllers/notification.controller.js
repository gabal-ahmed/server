import * as notificationService from '../services/notification.service.js';

export const getMyNotifications = async (req, res) => {
    try {
        const notifications = await notificationService.getUserNotifications(req.user.id);
        const unreadCount = await notificationService.getUnreadCount(req.user.id);
        res.json({ notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const markRead = async (req, res) => {
    try {
        await notificationService.markAsRead(req.user.id, req.params.id);
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const markAllRead = async (req, res) => {
    try {
        await notificationService.markAllAsRead(req.user.id);
        res.json({ message: 'All marked as read' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

import * as adminService from '../services/admin.service.js';

export const getBannedWords = async (req, res) => {
    try {
        const config = await adminService.getSystemConfig();
        res.json(config.bannedWords);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateBannedWords = async (req, res) => {
    try {
        const { words } = req.body;
        if (!Array.isArray(words)) throw new Error('Words must be an array');
        const config = await adminService.updateBannedWords(words);
        res.json(config.bannedWords);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const blockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        await adminService.toggleUserBlock(userId, true);
        res.json({ message: 'User blocked' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const unblockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        await adminService.toggleUserBlock(userId, false);
        res.json({ message: 'User unblocked' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getModerationFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const result = await adminService.getRecentQA({ page, limit, search });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const adminDeleteContent = async (req, res) => {
    try {
        const { type, id } = req.body; // type: 'question' or 'answer'
        await adminService.deleteContentAsAdmin(type, id);
        res.json({ message: 'Content deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const result = await adminService.getLogs({ page, limit, search });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPendingUsers = async (req, res) => {
    try {
        const users = await adminService.getPendingUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const approveUser = async (req, res) => {
    try {
        const { userId } = req.params;
        await adminService.approveUser(userId);

        // Log it
        await adminService.logActivity({
            userId: req.user.id,
            action: 'APPROVE_USER',
            details: { targetId: userId },
            ip: req.ip
        });

        res.json({ message: 'User approved' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const rejectUser = async (req, res) => {
    try {
        const { userId } = req.params;
        await adminService.rejectUser(userId);

        // Log it
        await adminService.logActivity({
            userId: req.user.id,
            action: 'REJECT_USER',
            details: { targetId: userId },
            ip: req.ip
        });

        res.json({ message: 'User rejected' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSystemReports = async (req, res) => {
    try {
        const reports = await adminService.getSystemReports();
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

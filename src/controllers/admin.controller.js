import * as adminService from '../services/admin.service.js';

export const getLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';

        const logs = await adminService.getActivityLogs({ page, limit, search });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getReports = async (req, res) => {
    try {
        const reports = await adminService.getGlobalReports();
        res.json(reports);
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
        const { id } = req.params;
        const result = await adminService.approveUser(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const rejectUser = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await adminService.rejectUser(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

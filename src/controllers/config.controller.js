import * as configService from '../services/config.service.js';
import { logActivity } from '../services/admin.service.js';

export const getConfig = async (req, res) => {
    try {
        const config = await configService.getConfig();
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateConfig = async (req, res) => {
    try {
        const config = await configService.updateConfig(req.body);

        await logActivity({
            userId: req.user.id,
            action: 'UPDATE_SYSTEM_CONFIG',
            details: req.body,
            ip: req.ip
        });

        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

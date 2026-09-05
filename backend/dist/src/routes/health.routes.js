import { Router } from 'express';
import { isDatabaseReady, isRedisReady } from '../config/index.js';
export const healthRoutes = Router();
healthRoutes.get('/health', (_req, res) => res.json({ success: true, message: 'Service is healthy', data: { status: 'ok' } }));
healthRoutes.get('/ready', (_req, res) => {
    const dependencies = { mongodb: isDatabaseReady(), redis: isRedisReady() };
    const ready = Object.values(dependencies).every(Boolean);
    res.status(ready ? 200 : 503).json({
        success: ready,
        message: ready ? 'Service is ready' : 'Service is not ready',
        data: { status: ready ? 'ready' : 'not-ready', dependencies },
    });
});

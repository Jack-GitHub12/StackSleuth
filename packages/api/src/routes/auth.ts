import { Router } from 'express';

const router = Router();

router.get('/ping', (req, res) => res.json({ status: 'auth ok' }));

export default router; 
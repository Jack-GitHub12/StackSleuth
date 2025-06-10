import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => res.json({ received: true }));
router.get('/', (req, res) => res.json({ metrics: [] }));

export default router; 
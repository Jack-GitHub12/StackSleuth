import { Router } from 'express';
const router = Router();
router.get('/', (req,res)=>res.json([]));
router.post('/', (req,res)=>res.status(201).json({id:'alert_1'}));
export default router; 
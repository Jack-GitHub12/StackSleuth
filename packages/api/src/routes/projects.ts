import { Router } from 'express';
const router = Router();
router.get('/', (req,res)=>res.json([]));
router.post('/',(req,res)=>res.status(201).json({id:'proj_1'}));
export default router; 
import { Router } from 'express';
const router = Router();
router.post('/', (req,res)=>res.status(202).json({reportId:'rep_1'}));
router.get('/:reportId',(req,res)=>res.json({status:'processing'}));
export default router; 
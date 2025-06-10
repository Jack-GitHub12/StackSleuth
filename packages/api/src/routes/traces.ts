import { Router } from 'express';
const router = Router();
router.post('/', (req,res)=>res.json({ok:true}));
router.get('/:traceId', (req,res)=>res.json({traceId:req.params.traceId,spans:[]}));
export default router; 
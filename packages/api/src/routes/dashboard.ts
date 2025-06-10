import { Router } from 'express';
const router = Router();
router.get('/:projectId', (req,res)=>res.json({projectId:req.params.projectId,widgets:[]}));
export default router; 
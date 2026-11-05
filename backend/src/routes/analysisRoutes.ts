import { Router } from 'express';
import { AnalysisController } from '../controllers/analysisController';
import { authenticateJwt } from '../middleware/auth';
import { enforceOrgIsolation } from '../middleware/orgIsolation';

const router = Router();

router.use(authenticateJwt);
router.use(enforceOrgIsolation);

router.post('/trigger', AnalysisController.triggerAnalysis);
router.get('/version/:versionId', AnalysisController.getAnalysisByVersion);

export default router;

import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticateJwt } from '../middleware/auth';
import { enforceOrgIsolation } from '../middleware/orgIsolation';

const router = Router();

router.use(authenticateJwt);
router.use(enforceOrgIsolation);

router.get('/metrics', AnalyticsController.getGovernanceMetrics);

export default router;

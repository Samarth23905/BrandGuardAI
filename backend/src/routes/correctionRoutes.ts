import { Router } from 'express';
import { CorrectionController } from '../controllers/correctionController';
import { authenticateJwt } from '../middleware/auth';
import { enforceOrgIsolation } from '../middleware/orgIsolation';

const router = Router();

router.use(authenticateJwt);
router.use(enforceOrgIsolation);

router.patch('/:id/status', CorrectionController.updateSuggestionStatus);
router.post('/apply-batch', CorrectionController.applyBatchCorrections);

export default router;

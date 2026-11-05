import { Router } from 'express';
import { BrandGuidelineController } from '../controllers/brandGuidelineController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { enforceOrgIsolation } from '../middleware/orgIsolation';

const router = Router();

router.use(authenticateJwt);
router.use(enforceOrgIsolation);

router.get('/', BrandGuidelineController.listGuidelines);
router.post('/', requireRole('ADMIN'), BrandGuidelineController.createGuideline);
router.patch('/:id', requireRole('ADMIN'), BrandGuidelineController.updateGuideline);
router.delete('/:id', requireRole('ADMIN'), BrandGuidelineController.deleteGuideline);

export default router;

import { Router } from 'express';
import { ApprovedFactController } from '../controllers/approvedFactController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { enforceOrgIsolation } from '../middleware/orgIsolation';

const router = Router();

router.use(authenticateJwt);
router.use(enforceOrgIsolation);

router.get('/', ApprovedFactController.listFacts);
router.post('/', requireRole('ADMIN'), ApprovedFactController.createFact);
router.patch('/:id', requireRole('ADMIN'), ApprovedFactController.updateFact);
router.delete('/:id', requireRole('ADMIN'), ApprovedFactController.deleteFact);

export default router;

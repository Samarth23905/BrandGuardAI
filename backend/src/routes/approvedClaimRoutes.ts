import { Router } from 'express';
import { ApprovedClaimController } from '../controllers/approvedClaimController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { enforceOrgIsolation } from '../middleware/orgIsolation';

const router = Router();

router.use(authenticateJwt);
router.use(enforceOrgIsolation);

router.get('/', ApprovedClaimController.listClaims);
router.post('/', requireRole('ADMIN'), ApprovedClaimController.createClaim);
router.patch('/:id', requireRole('ADMIN'), ApprovedClaimController.updateClaim);
router.delete('/:id', requireRole('ADMIN'), ApprovedClaimController.deleteClaim);

export default router;

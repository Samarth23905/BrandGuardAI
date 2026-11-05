import { Router } from 'express';
import { RestrictedClaimController } from '../controllers/restrictedClaimController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { enforceOrgIsolation } from '../middleware/orgIsolation';

const router = Router();

router.use(authenticateJwt);
router.use(enforceOrgIsolation);

router.get('/', RestrictedClaimController.listRestricted);
router.post('/', requireRole('ADMIN'), RestrictedClaimController.createRestricted);
router.patch('/:id', requireRole('ADMIN'), RestrictedClaimController.updateRestricted);
router.delete('/:id', requireRole('ADMIN'), RestrictedClaimController.deleteRestricted);

export default router;

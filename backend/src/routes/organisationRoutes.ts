import { Router } from 'express';
import { OrganisationController } from '../controllers/organisationController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { enforceOrgIsolation } from '../middleware/orgIsolation';

const router = Router();

router.use(authenticateJwt);
router.use(enforceOrgIsolation);

router.get('/', OrganisationController.getOrganisation);
router.patch('/settings', requireRole('ADMIN'), OrganisationController.updateSettings);
router.get('/members', OrganisationController.getMembers);

export default router;

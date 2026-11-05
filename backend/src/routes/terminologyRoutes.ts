import { Router } from 'express';
import { TerminologyController } from '../controllers/terminologyController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { enforceOrgIsolation } from '../middleware/orgIsolation';

const router = Router();

router.use(authenticateJwt);
router.use(enforceOrgIsolation);

router.get('/', TerminologyController.listRules);
router.post('/', requireRole('ADMIN'), TerminologyController.createRule);
router.patch('/:id', requireRole('ADMIN'), TerminologyController.updateRule);
router.delete('/:id', requireRole('ADMIN'), TerminologyController.deleteRule);

export default router;

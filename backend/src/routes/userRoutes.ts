import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { enforceOrgIsolation } from '../middleware/orgIsolation';

const router = Router();

router.use(authenticateJwt);
router.use(enforceOrgIsolation);

router.get('/', requireRole('ADMIN'), UserController.listUsers);
router.post('/', requireRole('ADMIN'), UserController.createUser);
router.patch('/:userId', requireRole('ADMIN'), UserController.updateUser);

export default router;

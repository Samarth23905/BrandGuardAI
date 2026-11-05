import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateJwt } from '../middleware/auth';
import { enforceOrgIsolation } from '../middleware/orgIsolation';

const router = Router();

router.use(authenticateJwt);
router.use(enforceOrgIsolation);

router.get('/', NotificationController.listNotifications);
router.patch('/:id/read', NotificationController.markAsRead);

export default router;

import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { enforceOrgIsolation } from '../middleware/orgIsolation';

const router = Router();

router.use(authenticateJwt);
router.use(enforceOrgIsolation);

router.get('/queue', requireRole('ADMIN', 'REVIEWER'), ReviewController.getReviewQueue);
router.get('/history', requireRole('ADMIN', 'REVIEWER'), ReviewController.listReviews);
router.post('/submission/:submissionId/decision', requireRole('ADMIN', 'REVIEWER'), ReviewController.submitDecision);
router.post('/submission/:submissionId/comment', ReviewController.addComment);

export default router;

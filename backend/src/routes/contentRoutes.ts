import { Router } from 'express';
import { ContentController } from '../controllers/contentController';
import { authenticateJwt } from '../middleware/auth';
import { enforceOrgIsolation } from '../middleware/orgIsolation';

const router = Router();

router.use(authenticateJwt);
router.use(enforceOrgIsolation);

router.post('/', ContentController.createSubmission);
router.get('/', ContentController.listSubmissions);
router.get('/:id', ContentController.getSubmission);
router.post('/:id/revise', ContentController.submitRevision);
router.get('/:id/compare', ContentController.compareVersions);

export default router;

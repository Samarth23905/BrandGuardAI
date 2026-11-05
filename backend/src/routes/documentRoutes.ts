import { Router } from 'express';
import { DocumentController } from '../controllers/documentController';
import { authenticateJwt } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { enforceOrgIsolation } from '../middleware/orgIsolation';
import { documentUpload } from '../middleware/upload';

const router = Router();

router.use(authenticateJwt);
router.use(enforceOrgIsolation);

router.get('/', DocumentController.listDocuments);
router.get('/:id', DocumentController.getDocument);
router.post('/upload', requireRole('ADMIN'), documentUpload.single('file'), DocumentController.uploadDocument);
router.delete('/:id', requireRole('ADMIN'), DocumentController.deleteDocument);

export default router;

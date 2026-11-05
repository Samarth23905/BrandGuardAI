import { Router } from 'express';
import authRoutes from './authRoutes';
import organisationRoutes from './organisationRoutes';
import userRoutes from './userRoutes';
import brandGuidelineRoutes from './brandGuidelineRoutes';
import documentRoutes from './documentRoutes';
import approvedFactRoutes from './approvedFactRoutes';
import approvedClaimRoutes from './approvedClaimRoutes';
import restrictedClaimRoutes from './restrictedClaimRoutes';
import terminologyRoutes from './terminologyRoutes';
import contentRoutes from './contentRoutes';
import analysisRoutes from './analysisRoutes';
import correctionRoutes from './correctionRoutes';
import reviewRoutes from './reviewRoutes';
import analyticsRoutes from './analyticsRoutes';
import notificationRoutes from './notificationRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/organisations', organisationRoutes);
router.use('/users', userRoutes);
router.use('/brand-guidelines', brandGuidelineRoutes);
router.use('/documents', documentRoutes);
router.use('/approved-facts', approvedFactRoutes);
router.use('/approved-claims', approvedClaimRoutes);
router.use('/restricted-claims', restrictedClaimRoutes);
router.use('/terminology', terminologyRoutes);
router.use('/content', contentRoutes);
router.use('/analysis', analysisRoutes);
router.use('/corrections', correctionRoutes);
router.use('/reviews', reviewRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);

export default router;

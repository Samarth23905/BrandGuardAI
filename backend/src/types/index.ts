import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'ADMIN' | 'CREATOR' | 'REVIEWER';

export type GuidelineCategory = 
  | 'TONE' 
  | 'STYLE' 
  | 'MESSAGING' 
  | 'VISUAL' 
  | 'ACCESSIBILITY' 
  | 'POLICY';

export type SeverityLevel = 'CRITICAL' | 'MAJOR' | 'MINOR';

export type ClaimCategory = 
  | 'FACTUAL'
  | 'PRODUCT'
  | 'PERFORMANCE'
  | 'COMPARATIVE'
  | 'SUPERIORITY'
  | 'GUARANTEE'
  | 'HEALTH_SAFETY'
  | 'PROMOTIONAL';

export type VerificationStatus = 
  | 'SUPPORTED' 
  | 'CONTRADICTED' 
  | 'UNSUPPORTED' 
  | 'AMBIGUOUS';

export type SubmissionStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ANALYSING'
  | 'NEEDS_REVISION'
  | 'READY_FOR_REVIEW'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type DocumentProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type ReviewDecision = 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';

export type ContentType = 
  | 'AD_COPY' 
  | 'BLOG_POST' 
  | 'SOCIAL_POST' 
  | 'PRODUCT_DESCRIPTION' 
  | 'PRESS_RELEASE' 
  | 'EMAIL_NEWSLETTER'
  | 'GENERAL_COPY';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  organisationId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
  organisationId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type UserRole = 'ADMIN' | 'CREATOR' | 'REVIEWER';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  organisationId: string | any;
  avatarUrl?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface OrganisationSettings {
  allowCreatorSelfApproval: boolean;
  minPassingScore: number;
  blockCriticalViolations: boolean;
  requireReviewerNotes: boolean;
  scoringWeights: {
    critical: number;
    major: number;
    minor: number;
  };
}

export interface Organisation {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  industry: string;
  website?: string;
  description?: string;
  settings: OrganisationSettings;
}

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

export type VerificationStatus = 'SUPPORTED' | 'CONTRADICTED' | 'UNSUPPORTED' | 'AMBIGUOUS';

export type SubmissionStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ANALYSING'
  | 'NEEDS_REVISION'
  | 'READY_FOR_REVIEW'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type ContentType = 
  | 'AD_COPY' 
  | 'BLOG_POST' 
  | 'SOCIAL_POST' 
  | 'PRODUCT_DESCRIPTION' 
  | 'PRESS_RELEASE' 
  | 'EMAIL_NEWSLETTER'
  | 'GENERAL_COPY';

export interface BrandGuideline {
  _id: string;
  category: 'TONE' | 'STYLE' | 'MESSAGING' | 'VISUAL' | 'ACCESSIBILITY' | 'POLICY';
  title: string;
  ruleDescription: string;
  severity: SeverityLevel;
  sourceDocument?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface BrandDocument {
  _id: string;
  title: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  filePath: string;
  category: string;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  chunkCount: number;
  version: string;
  uploadedBy?: { name: string; email: string };
  createdAt: string;
}

export interface ApprovedFact {
  _id: string;
  category: 'PRODUCT' | 'PRICING' | 'INGREDIENT' | 'PERFORMANCE' | 'COMPANY';
  title: string;
  factStatement: string;
  productRef?: string;
  verificationEvidence?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ApprovedClaim {
  _id: string;
  category: string;
  claimStatement: string;
  permittedContext?: string;
  substantiationDocumentRef?: string;
  isActive: boolean;
  createdAt: string;
}

export interface RestrictedClaim {
  _id: string;
  category: string;
  restrictedPattern: string;
  reason: string;
  riskSeverity: SeverityLevel;
  suggestedAlternative?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TerminologyRule {
  _id: string;
  termType: 'RESTRICTED' | 'APPROVED' | 'PREFERRED_ALTERNATIVE' | 'PRODUCT_NAMING';
  term: string;
  replacementOrAlternative?: string;
  ruleContext?: string;
  caseSensitive: boolean;
  severity: SeverityLevel;
  isActive: boolean;
  createdAt: string;
}

export interface EvidenceChunkMatch {
  documentTitle: string;
  similarityScore: number;
  snippet: string;
}

export interface ClaimFinding {
  _id: string;
  claimText: string;
  claimCategory: ClaimCategory;
  startIndex: number;
  endIndex: number;
  verificationStatus: VerificationStatus;
  severity: SeverityLevel;
  confidence: number;
  explanation: string;
  matchedEvidenceChunks: EvidenceChunkMatch[];
  isViolation: boolean;
}

export interface CorrectionSuggestion {
  _id: string;
  claimFindingId?: string;
  originalText: string;
  problemType: string;
  reason: string;
  suggestedReplacement: string;
  rationale: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'MODIFIED';
  userFeedback?: string;
}

export interface DeductionItem {
  category: string;
  severity: SeverityLevel;
  deductionPoints: number;
  reason: string;
}

export interface AnalysisResult {
  _id: string;
  submissionId: string;
  versionId: string;
  overallScore: {
    initialScore: number;
    finalScore: number;
    statusBand: 'STRONG' | 'NEEDS_IMPROVEMENT' | 'HIGH_RISK';
    totalDeductions: number;
  };
  deductionsBreakdown: DeductionItem[];
  claimsSummary: {
    totalClaims: number;
    supported: number;
    contradicted: number;
    unsupported: number;
    ambiguous: number;
  };
  toneEvaluation: {
    detectedTone: string;
    expectedTone: string;
    isCompliant: boolean;
    explanation: string;
  };
  terminologyEvaluation: {
    issuesFound: number;
    restrictedTermsCount: number;
  };
  messagingEvaluation: {
    isCompliant: boolean;
    explanation: string;
  };
  accessibilityEvaluation: {
    readingEaseScore: number;
    readingGradeLevel: string;
    issues: string[];
  };
  status: 'COMPLETED' | 'FAILED';
  processingTimeMs: number;
  aiModelUsed: string;
  createdAt: string;
}

export interface ContentVersion {
  _id: string;
  submissionId: string;
  versionNumber: number;
  rawContent: string;
  wordCount: number;
  notes?: string;
  correctionsApplied?: Array<{
    originalText: string;
    replacementText: string;
    appliedAt: string;
  }>;
  createdAt: string;
}

export interface ContentSubmission {
  _id: string;
  title: string;
  contentType: ContentType;
  targetAudience?: string;
  channel?: string;
  currentVersionNumber: number;
  latestVersionId?: ContentVersion;
  status: SubmissionStatus;
  creatorId: { _id: string; name: string; email: string; avatarUrl?: string };
  assignedReviewerId?: { _id: string; name: string; email: string };
  latestScore?: number;
  criticalViolationsCount?: number;
  finalDecision?: {
    status: string;
    comment?: string;
    decidedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReviewComment {
  _id: string;
  submissionId: string;
  authorId: { _id: string; name: string; email: string; role: UserRole; avatarUrl?: string };
  text: string;
  anchorText?: string;
  isResolved: boolean;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

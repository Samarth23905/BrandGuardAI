# BrandGuard AI Database Schema

All models reside under MongoDB and enforce multi-tenant isolation via `organisationId`.

## Schemas
1. **User**: Name, email, hashed password, role (`ADMIN`, `CREATOR`, `REVIEWER`), status.
2. **Organisation**: Name, slug, industry, website, settings.
3. **OrganisationMembership**: Maps users to organisations with roles.
4. **BrandGuideline**: Category (`TONE`, `STYLE`, `MESSAGING`, `ACCESSIBILITY`, `POLICY`), title, ruleDescription, severity.
5. **BrandDocument**: Uploaded file metadata, file path, mime type, chunk count, processing status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`).
6. **DocumentChunk**: Text chunk, 768d embedding vector, page number, document reference.
7. **ApprovedFact**: Category, statement, productRef, verificationEvidence.
8. **ApprovedClaim**: Claim statement, permitted context, documentation reference.
9. **RestrictedClaim**: Restricted pattern, compliance reason, risk severity (`CRITICAL`, `MAJOR`, `MINOR`), suggested alternative.
10. **TerminologyRule**: Term, type (`RESTRICTED`, `PRODUCT_NAMING`, `PREFERRED_ALTERNATIVE`, `APPROVED`), replacement, case sensitivity.
11. **ContentSubmission**: Title, type, current version, latest score, status (`DRAFT`, `SUBMITTED`, `ANALYSING`, `NEEDS_REVISION`, `READY_FOR_REVIEW`, `IN_REVIEW`, `APPROVED`, `REJECTED`), creator ID, reviewer ID, final decision.
12. **ContentVersion**: Submission ID, version number (1, 2, 3...), raw content, word count, corrections applied.
13. **AnalysisResult**: Submission ID, version ID, overall score breakdown, claims summary, tone evaluation, accessibility score.
14. **ClaimFinding**: Claim text, category, verification status, severity, explanation, matched evidence chunks.
15. **CorrectionSuggestion**: Original text, problem type, suggested replacement, rationale, status (`PENDING`, `ACCEPTED`, `REJECTED`, `MODIFIED`).
16. **Review**: Reviewer ID, decision (`APPROVED`, `CHANGES_REQUESTED`, `REJECTED`), decision summary, notes, timestamp.
17. **ReviewComment**: Author ID, text, anchor text, resolved state.
18. **AuditLog**: Actor ID, role, action, entity type, entity ID, metadata details, IP address.
19. **Notification**: Recipient ID, title, message, type, read state.

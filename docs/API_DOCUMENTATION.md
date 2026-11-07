# BrandGuard AI API Documentation

Base Endpoint: `/api/v1`

## Authentication (`/auth`)
* `POST /auth/register` - Register a new organization and admin user.
* `POST /auth/login` - Authenticate user and receive JWT.
* `GET /auth/me` - Retrieve authenticated user profile.

## Content Governance (`/content`)
* `POST /content` - Submit marketing copy and trigger immediate AI analysis.
* `GET /content` - List submissions with role-based filtering.
* `GET /content/:id` - Retrieve full submission details, versions, latest findings, and comments.
* `POST /content/:id/revise` - Submit a revised version (V2, V3) and trigger revalidation.
* `GET /content/:id/compare?v1=1&v2=2` - Compare two versions with score delta and resolved findings.

## Reviews & Approvals (`/reviews`)
* `GET /reviews/queue` - Get submissions awaiting review.
* `GET /reviews/history` - Get completed review decisions audit trail.
* `POST /reviews/submission/:id/decision` - Approve, request changes, or reject copy (Requires ADMIN or REVIEWER).
* `POST /reviews/submission/:id/comment` - Add inline reviewer comment to submission.

## Knowledge Hub
* `GET /brand-guidelines`, `POST /brand-guidelines`, `PATCH /brand-guidelines/:id`, `DELETE /brand-guidelines/:id`
* `GET /documents`, `POST /documents/upload`, `GET /documents/:id`, `DELETE /documents/:id`
* `GET /approved-facts`, `POST /approved-facts`, `PATCH /approved-facts/:id`, `DELETE /approved-facts/:id`
* `GET /approved-claims`, `POST /approved-claims`, `PATCH /approved-claims/:id`, `DELETE /approved-claims/:id`
* `GET /restricted-claims`, `POST /restricted-claims`, `PATCH /restricted-claims/:id`, `DELETE /restricted-claims/:id`
* `GET /terminology`, `POST /terminology`, `PATCH /terminology/:id`, `DELETE /terminology/:id`

## Analytics & Monitoring
* `GET /analytics/metrics` - Real-time MongoDB aggregation analytics for scores, volumes, and top violations.
* `GET /health` - System, database, and Gemini provider health check.

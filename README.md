# BrandGuard AI
> **Create Freely. Publish Confidently.**

BrandGuard AI is an AI-powered Brand Governance and Content Compliance SaaS Platform. It acts as an intelligent checkpoint between content creation and publication, ensuring every piece of marketing copy adheres strictly to approved brand guidelines, factual product formulations, approved promotional claims, and regulatory policies.

---

## Key Features

1. **RAG Knowledge Retrieval**: Extracts and indexes PDF, DOCX, and TXT brand manuals using Gemini `text-embedding-004` and vector search.
2. **AI-Powered Claim Extraction**: Automatically detects factual, product, performance, guarantee, and comparative claims.
3. **Evidence-Based Claim Verification**: Validates claims against authoritative facts (`SUPPORTED`, `CONTRADICTED`, `UNSUPPORTED`, `AMBIGUOUS`).
4. **Deterministic Compliance Scoring**: Initial score of 100 with mathematically calculated penalties (-25 Critical, -10 Major, -3 Minor).
5. **Brand Tone & Accessibility Analysis**: Tests tone alignment and Flesch Reading Ease scores.
6. **Explainable Correction Engine**: Generates drop-in compliant replacements with editorial rationale.
7. **Version History & Revalidation**: Full multi-version diffing (V1, V2, V3) with automatic revalidation of revised text.
8. **Human Approval Workflow**: Content creators cannot approve their own copy. Authorized human reviewers gate publication.
9. **Governance Analytics**: Real MongoDB aggregation metrics on brand compliance health, recurring risk patterns, and review turnaround times.

---

## Demonstration Credentials (Local / Staging)

The platform comes pre-seeded with the **FitFuel Nutrition** organization:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@fitfuel.com` | `Password123!` |
| **Creator** | `creator@fitfuel.com` | `Password123!` |
| **Reviewer** | `reviewer@fitfuel.com` | `Password123!` |

*(You can also register a brand new organization from the UI)*

---

## Local Development Setup

### 1. Prerequisites
* Node.js v18+ (tested on Node v24)
* MongoDB (Local instance or MongoDB Atlas)
* Google Gemini API Key

### 2. Backend Setup
```bash
cd backend
npm install
npm run seed     # Seeds demo organization (FitFuel Nutrition)
npm run dev      # Starts API server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

### 4. Running Automated Tests
```bash
cd backend
npm test
```

---

## Render Deployment Guide

BrandGuard AI is ready for 1-click deployment using `render.yaml`.

### 1. Deploy via Render Blueprint
1. Push this repository to GitHub.
2. Go to [dashboard.render.com](https://dashboard.render.com/) $\rightarrow$ **New +** $\rightarrow$ **Blueprint**.
3. Select your repository. Render automatically configures:
   * **Backend Web Service** (`brandguard-backend`)
   * **Frontend Static Site** (`brandguard-frontend`)
4. Set your environment variables:
   * `MONGODB_URI`: MongoDB Atlas connection string (allow `0.0.0.0/0` in Atlas Network Access)
   * `GEMINI_API_KEY`: Google Gemini API Key

### 2. Manual Render Configuration
* **Backend**:
  * Build Command: `npm install --include=dev && npm run build`
  * Start Command: `npm start`
* **Frontend**:
  * Build Command: `npm install && npm run build`
  * Publish Directory: `dist`
  * Rewrite rule: `/*` $\rightarrow$ `/index.html`

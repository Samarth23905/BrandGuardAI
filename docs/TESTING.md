# BrandGuard AI Automated Testing & Quality Assurance

## Running the Automated Test Suite
From the `backend` directory:
```bash
npm test
```

## Test Suite Coverage
* **`auth_rbac.test.ts`**:
  * Admin registration & organization initialization
  * User login & JWT issuance
  * Team member creation with roles
  * RBAC enforcement (Creators blocked from Admin endpoints)
  * Organization isolation (Cross-tenant modifications blocked)
* **`ai_compliance_pipeline.test.ts`**:
  * **TEST 1**: 25g protein specification verified as `SUPPORTED` (matches lab spec).
  * **TEST 2**: 40g protein specification verified as `CONTRADICTED` (-25 pts Critical penalty).
  * **TEST 3**: 100% muscle growth guarantee verified as prohibited/`CONTRADICTED` (-25 pts Critical penalty).
  * **TEST 4**: "Best supplement in India" flagged as unverified `SUPERIORITY` (-10 pts Major penalty).
  * **TEST 5**: Compliant product description achieves $\ge 90$ (`STRONG` score).
  * **TEST 6**: Revision of copy triggers complete revalidation, resolving issues and boosting score (+27 pts).
* **`scoring_workflow.test.ts`**:
  * Deterministic mathematical deduction engine (-25, -10, -3)
  * Anti-self-approval enforcement (Creators cannot approve their own submissions)
  * Reviewer approval & audit logging
  * Change request workflow with feedback notes

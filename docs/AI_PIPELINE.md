# BrandGuard AI Pipeline & Scoring Engine

## 1. Document Extraction & Chunking
* Supported file formats: `.pdf`, `.docx`, `.txt`.
* Files are parsed into clean text and segmented by semantic paragraphs and sentences into overlapping chunks (max 550 chars, 100 char overlap).
* Embeddings generated using `text-embedding-004` (768 dimensions) with a deterministic fallback vector engine for offline/test environments.

## 2. Claim Extraction
Isolates explicit assertions from submitted copy into 8 categories:
1. `FACTUAL` (Quantities, certifications, metrics)
2. `PRODUCT` (Ingredients, formulation, features)
3. `PERFORMANCE` (Speed, athletic outcomes, results)
4. `COMPARATIVE` (Direct or indirect competitor comparisons)
5. `SUPERIORITY` (Superlatives: "best", "#1", "unmatched")
6. `GUARANTEE` (Absolute guarantees, 100% promises, risk-free)
7. `HEALTH_SAFETY` (Physiological, medical, health effects)
8. `PROMOTIONAL` (General marketing praise)

## 3. Truth & Compliance Verification
Claims are evaluated against retrieved RAG chunks, active `ApprovedFacts`, and `RestrictedClaims`:
* `SUPPORTED`: Direct corroboration from official records.
* `CONTRADICTED`: Conflicts directly with approved facts or restricted policies.
* `UNSUPPORTED`: Lacks explicit substantiation (Note: Unsupported != false).
* `AMBIGUOUS`: Conflicting or incomplete evidence.

## 4. Deterministic Scoring Logic
Compliance score is strictly deterministic:
$$\text{Final Score} = \max\left(0, 100 - \sum \text{Deductions}\right)$$

* `CRITICAL`: -25 points
* `MAJOR`: -10 points
* `MINOR`: -3 points
* Duplicate penalties for identical underlying issues are prevented.
* Score Bands:
  * 90–100: **Strong Compliance**
  * 70–89: **Needs Improvement**
  * 0–69: **High Compliance Risk**

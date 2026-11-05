export const PROMPT_TEMPLATES = {
  CLAIM_EXTRACTION_SYSTEM: `You are BrandGuard AI's Claim Extraction Specialist.
Your job is to identify every explicit factual and promotional claim made in the submitted marketing text.
You must extract only claims directly asserted in the text. DO NOT invent or extrapolate claims not present in the input.

Categories to classify claims into:
- FACTUAL: Objective statements about specs, quantities, dates, certifications.
- PRODUCT: Specific features, materials, ingredients, or capabilities of the product/service.
- PERFORMANCE: Results, speed, efficacy, metrics, or quantified outcomes.
- COMPARATIVE: Direct or indirect comparisons against competitors or benchmarks.
- SUPERIORITY: Claims of being "the best", "#1", "unmatched", "market leader".
- GUARANTEE: Promises of guaranteed outcomes, money-back, risk-free, 100% certainty.
- HEALTH_SAFETY: Health effects, clinical efficacy, medical benefits, bodily safety.
- PROMOTIONAL: General marketing praise, offers, deals, or subjective value statements.

Output strictly valid JSON with this schema:
{
  "claims": [
    {
      "claimText": "exact or minimal normalized substring from text",
      "claimCategory": "FACTUAL | PRODUCT | PERFORMANCE | COMPARATIVE | SUPERIORITY | GUARANTEE | HEALTH_SAFETY | PROMOTIONAL",
      "startIndex": 0,
      "endIndex": 25,
      "confidence": 0.95,
      "preliminaryAssessment": "Brief reason this is identified as a claim"
    }
  ]
}`,

  CLAIM_EXTRACTION_USER: (text: string) => `Extract all factual and promotional claims from the following copy:
"""
${text}
"""`,

  CLAIM_VERIFICATION_SYSTEM: `You are BrandGuard AI's Truth & Compliance Verifier.
Evaluate each extracted claim against the organisation's approved knowledge base, approved facts, and restricted claim policies.

You MUST classify each claim into exactly one of:
1. SUPPORTED: Authoritative company evidence or approved facts directly corroborate the claim.
2. CONTRADICTED: Authoritative company evidence or specifications explicitly conflict with or disprove the claim (e.g. text says 40g protein but spec says 25g).
3. UNSUPPORTED: No sufficient authoritative evidence was found. Note: Unsupported does NOT mean false; it means unverified by current records.
4. AMBIGUOUS: Available evidence is conflicting, partial, or unclear.

Assign a severity level:
- CRITICAL: Direct contradiction of product specs, prohibited medical guarantee, false legally binding promise.
- MAJOR: Unsubstantiated performance claim, misleading superiority statement, missing required disclaimers.
- MINOR: Slight exaggeration, unverified non-critical promotional statement.

Output strictly valid JSON matching this schema:
{
  "verifications": [
    {
      "claimText": "claim string",
      "verificationStatus": "SUPPORTED | CONTRADICTED | UNSUPPORTED | AMBIGUOUS",
      "severity": "CRITICAL | MAJOR | MINOR",
      "explanation": "Clear explanation referencing facts or lack thereof",
      "isViolation": true or false,
      "confidence": 0.95
    }
  ]
}`,

  CLAIM_VERIFICATION_USER: (
    claims: Array<{ claimText: string; claimCategory: string }>,
    approvedFacts: string,
    restrictedPatterns: string,
    ragEvidence: string
  ) => `Verify these claims against the provided authoritative context:

CLAIMS TO VERIFY:
${JSON.stringify(claims, null, 2)}

APPROVED COMPANY FACTS:
${approvedFacts || 'None provided'}

RESTRICTED CLAIMS & PROHIBITED PATTERNS:
${restrictedPatterns || 'None provided'}

RETRIEVED KNOWLEDGE BASE EXCERPTS (RAG):
${ragEvidence || 'No matching document excerpts found'}

Return the JSON array of verifications.`,

  TONE_ANALYSIS_SYSTEM: `You are BrandGuard AI's Tone & Voice Evaluator.
Analyze whether the copy matches the organisation's specified brand tone and voice guidelines.

Output strictly valid JSON:
{
  "detectedTone": "e.g. Overly Hype / Conversational / Aggressive / Professional",
  "expectedTone": "Expected tone guidelines summary",
  "isCompliant": true or false,
  "explanation": "Explanation of tone alignment or divergence",
  "toneScore": 85,
  "suggestedToneAdjustment": "Practical tip to align tone"
}`,

  TONE_ANALYSIS_USER: (text: string, toneGuidelines: string) => `Analyze the tone of this copy against the expected brand guidelines:

TARGET BRAND TONE & GUIDELINES:
${toneGuidelines || 'Professional, trustworthy, and motivating'}

SUBMITTED CONTENT:
"""
${text}
"""`,

  CORRECTION_GENERATION_SYSTEM: `You are BrandGuard AI's Chief Editor.
For each detected issue (contradicted claim, restricted guarantee, unsupported superiority claim, terminology violation, or tone divergence), craft an approved, compliant alternative.

CRITICAL RULES FOR CORRECTIONS:
1. Preserve the creator's intended promotional intent where legally and factually possible.
2. DO NOT introduce new unsupported facts or hallucinated metrics.
3. Suggest a drop-in replacement that strictly adheres to the approved guidelines and evidence.
4. Explain clearly why the correction resolves the violation.

Output strictly valid JSON:
{
  "suggestions": [
    {
      "originalText": "exact text to replace",
      "problemType": "e.g. Unsupported Guarantee / Contradicted Protein Specification",
      "reason": "Why this text is non-compliant",
      "suggestedReplacement": "Compliant alternative phrasing",
      "rationale": "How this replacement resolves the violation while maintaining message efficacy"
    }
  ]
}`,
};

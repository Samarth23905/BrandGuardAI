import { Types } from 'mongoose';
import { ITerminologyRule } from '../models/TerminologyRule';
import { SeverityLevel } from '../types';

export interface TerminologyViolation {
  ruleId: Types.ObjectId;
  term: string;
  termType: string;
  replacementOrAlternative?: string;
  severity: SeverityLevel;
  startIndex: number;
  endIndex: number;
  matchedText: string;
  reason: string;
}

export interface TerminologyCheckResult {
  issuesFound: number;
  restrictedTermsCount: number;
  violations: TerminologyViolation[];
}

export class TerminologyService {
  public static checkTerminology(
    content: string,
    rules: ITerminologyRule[]
  ): TerminologyCheckResult {
    const activeRules = rules.filter((r) => r.isActive);
    const violations: TerminologyViolation[] = [];

    for (const rule of activeRules) {
      const termPattern = rule.term.trim();
      if (!termPattern) continue;

      // Escape special regex characters in the term
      const escapedTerm = termPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const flags = rule.caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(`\\b${escapedTerm}\\b`, flags);

      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        let reason = '';
        if (rule.termType === 'RESTRICTED') {
          reason = `Use of prohibited term "${rule.term}". ${rule.replacementOrAlternative ? `Preferred alternative: "${rule.replacementOrAlternative}".` : ''} ${rule.ruleContext || ''}`;
        } else if (rule.termType === 'PRODUCT_NAMING') {
          reason = `Incorrect product naming convention for "${rule.term}". Must be written as "${rule.replacementOrAlternative || rule.term}".`;
        } else if (rule.termType === 'PREFERRED_ALTERNATIVE') {
          reason = `Non-preferred term "${rule.term}". Recommended alternative is "${rule.replacementOrAlternative}".`;
        } else {
          reason = `Terminology flag on "${rule.term}". ${rule.ruleContext || ''}`;
        }

        violations.push({
          ruleId: rule._id as Types.ObjectId,
          term: rule.term,
          termType: rule.termType,
          replacementOrAlternative: rule.replacementOrAlternative,
          severity: rule.severity || 'MINOR',
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          matchedText: match[0],
          reason: reason.trim(),
        });
      }
    }

    const restrictedCount = violations.filter((v) => v.termType === 'RESTRICTED').length;

    return {
      issuesFound: violations.length,
      restrictedTermsCount: restrictedCount,
      violations,
    };
  }
}

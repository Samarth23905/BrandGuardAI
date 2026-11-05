import { IBrandGuideline } from '../models/BrandGuideline';

export interface MessagingEvaluationResult {
  isCompliant: boolean;
  explanation: string;
  violationsCount: number;
  messagingNotes: string[];
}

export class MessagingService {
  public static evaluateMessaging(
    content: string,
    guidelines: IBrandGuideline[]
  ): MessagingEvaluationResult {
    const messagingRules = guidelines.filter(
      (g) => (g.category === 'MESSAGING' || g.category === 'POLICY') && g.isActive
    );

    const notes: string[] = [];
    let violations = 0;

    for (const rule of messagingRules) {
      // Check if negative patterns in ruleDescription are present
      if (rule.ruleDescription.toLowerCase().includes('prohibit') || rule.ruleDescription.toLowerCase().includes('do not')) {
        // Look for keywords
        const keywords = rule.title.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        const matches = keywords.filter(k => content.toLowerCase().includes(k));
        if (matches.length > 0 && rule.severity === 'CRITICAL') {
          violations++;
          notes.push(`Potential violation of messaging policy "${rule.title}": ${rule.ruleDescription}`);
        }
      }
    }

    const isCompliant = violations === 0;
    const explanation = isCompliant
      ? 'Content aligns with core brand messaging pillars and communication policies.'
      : `Identified ${violations} potential messaging policy deviation(s).`;

    return {
      isCompliant,
      explanation,
      violationsCount: violations,
      messagingNotes: notes,
    };
  }
}

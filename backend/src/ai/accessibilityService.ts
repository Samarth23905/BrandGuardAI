export interface AccessibilityEvaluationResult {
  readingEaseScore: number;
  readingGradeLevel: string;
  issues: string[];
}

export class AccessibilityService {
  public static evaluateTextAccessibility(content: string): AccessibilityEvaluationResult {
    const issues: string[] = [];
    if (!content || content.trim().length === 0) {
      return {
        readingEaseScore: 100,
        readingGradeLevel: 'Standard',
        issues: [],
      };
    }

    const sentences = content.match(/[^.!?\n]+[.!?\n]*/g) || [content];
    const words = content.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const sentenceCount = Math.max(1, sentences.length);

    // Syllable count estimation
    let totalSyllables = 0;
    let complexWordsCount = 0;

    for (const rawWord of words) {
      const word = rawWord.toLowerCase().replace(/[^a-z]/g, '');
      if (!word) continue;

      const syllables = this.countSyllables(word);
      totalSyllables += syllables;
      if (syllables >= 3) {
        complexWordsCount++;
      }
    }

    // Flesch Reading Ease formula:
    // 206.835 - 1.015 * (total words / total sentences) - 84.6 * (total syllables / total words)
    const wordsPerSentence = wordCount / sentenceCount;
    const syllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 1;

    let readingEase = Math.round(
      206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord
    );
    readingEase = Math.max(0, Math.min(100, readingEase));

    // Grade level description
    let gradeLevel = 'Easy to Read';
    if (readingEase < 30) {
      gradeLevel = 'Very Difficult (College Graduate level)';
      issues.push('Text readability is very low. Sentences and vocabulary are overly dense for consumer accessibility.');
    } else if (readingEase < 50) {
      gradeLevel = 'Difficult (College level)';
      issues.push('Reading difficulty is high. Consider simplifying technical terminology and breaking up long sentences.');
    } else if (readingEase < 60) {
      gradeLevel = 'Fairly Difficult (High School level)';
    } else if (readingEase < 70) {
      gradeLevel = 'Standard (Plain English 8th–9th grade)';
    } else if (readingEase < 80) {
      gradeLevel = 'Fairly Easy (7th grade)';
    } else {
      gradeLevel = 'Easy to Read (5th–6th grade)';
    }

    // Check sentence length
    for (const s of sentences) {
      const sWords = s.trim().split(/\s+/).filter(Boolean);
      if (sWords.length > 30) {
        issues.push(`Overly long sentence detected (${sWords.length} words): "${s.slice(0, 70)}...". Aim for under 25 words per sentence for accessibility.`);
        break;
      }
    }

    // Check CTA clarity if marketing text
    const hasCallToAction = /\b(visit|shop|order|learn more|click|get started|discover|try|sign up|buy now)\b/i.test(content);
    if (wordCount > 50 && !hasCallToAction) {
      issues.push('No clear, accessible call-to-action (CTA) detected. Provide direct, descriptive navigation for users of assistive technology.');
    }

    return {
      readingEaseScore: readingEase,
      readingGradeLevel: gradeLevel,
      issues,
    };
  }

  private static countSyllables(word: string): number {
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }
}

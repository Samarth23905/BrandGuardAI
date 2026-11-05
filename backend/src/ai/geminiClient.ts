import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { env } from '../config/env';

export class GeminiClient {
  private genAI: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor() {
    this.modelName = env.GEMINI_MODEL || 'gemini-2.5-flash';
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
  }

  public isAvailable(): boolean {
    return Boolean(this.genAI && env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '');
  }

  public getModelName(): string {
    return this.modelName;
  }

  public getModel(systemInstruction?: string): GenerativeModel | null {
    if (!this.genAI) return null;
    return this.genAI.getGenerativeModel({
      model: this.modelName,
      ...(systemInstruction ? { systemInstruction } : {}),
      generationConfig: {
        temperature: 0.1, // Low temperature for high deterministic consistency
        topP: 0.95,
      },
    });
  }

  /**
   * Generates a structured JSON response from Gemini with automatic retry and JSON extraction.
   */
  public async generateStructuredJson<T>(
    prompt: string,
    systemInstruction?: string,
    maxRetries = 2
  ): Promise<T | null> {
    if (!this.isAvailable()) {
      return null;
    }

    let attempts = 0;
    while (attempts <= maxRetries) {
      try {
        const model = this.getModel(systemInstruction);
        if (!model) return null;

        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const rawText = response.response.text();
        const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        const jsonString = jsonMatch ? (jsonMatch[1] ? jsonMatch[1] : jsonMatch[0]) : rawText;

        const parsed = JSON.parse(jsonString) as T;
        return parsed;
      } catch (err: any) {
        attempts++;
        console.warn(`[GeminiClient] Attempt ${attempts} failed: ${err.message}`);
        if (attempts > maxRetries) {
          throw new Error(`Gemini API error after ${maxRetries} retries: ${err.message}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 800 * attempts));
      }
    }
    return null;
  }
}

export const geminiClient = new GeminiClient();

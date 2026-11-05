import { Response } from 'express';
import { AnalysisResult } from '../models/AnalysisResult';
import { ClaimFinding } from '../models/ClaimFinding';
import { CorrectionSuggestion } from '../models/CorrectionSuggestion';
import { AnalysisOrchestrator } from '../services/analysisOrchestrator';
import { AuthenticatedRequest } from '../types';

export class AnalysisController {
  public static async triggerAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { versionId } = req.body;
    if (!versionId) {
      res.status(400).json({ success: false, message: 'versionId is required.' });
      return;
    }

    const result = await AnalysisOrchestrator.analyzeVersion(
      versionId,
      req.user!.userId,
      req.user!.role
    );

    res.status(200).json({
      success: true,
      message: 'Analysis completed successfully.',
      data: result,
    });
  }

  public static async getAnalysisByVersion(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { versionId } = req.params;

    const analysis = await AnalysisResult.findOne({
      versionId,
      organisationId: req.organisationId,
    });

    if (!analysis) {
      res.status(404).json({ success: false, message: 'Analysis not found for this version.' });
      return;
    }

    const [findings, suggestions] = await Promise.all([
      ClaimFinding.find({ analysisResultId: analysis._id }),
      CorrectionSuggestion.find({ analysisResultId: analysis._id }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Analysis result retrieved.',
      data: {
        analysis,
        findings,
        suggestions,
      },
    });
  }
}

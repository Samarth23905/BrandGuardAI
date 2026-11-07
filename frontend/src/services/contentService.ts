import { api } from './api';
import { ContentSubmission, ContentVersion, AnalysisResult, ClaimFinding, CorrectionSuggestion } from '../types';

export const contentService = {
  async createSubmission(payload: {
    title: string;
    contentType: string;
    targetAudience?: string;
    channel?: string;
    content: string;
  }) {
    const res = await api.post('/content', payload);
    return res.data.data;
  },

  async submitRevision(
    submissionId: string,
    payload: {
      content: string;
      notes?: string;
      correctionsApplied?: Array<{ originalText: string; replacementText: string; ruleRef?: string }>;
    }
  ) {
    const res = await api.post(`/content/${submissionId}/revise`, payload);
    return res.data.data;
  },

  async listSubmissions(params?: { status?: string; contentType?: string; creatorId?: string }) {
    const res = await api.get('/content', { params });
    return res.data.data as ContentSubmission[];
  },

  async getSubmission(id: string): Promise<{
    submission: ContentSubmission;
    versions: ContentVersion[];
    latestAnalysis: AnalysisResult | null;
    findings: ClaimFinding[];
    suggestions: CorrectionSuggestion[];
    comments: any[];
  }> {
    const res = await api.get(`/content/${id}`);
    return res.data.data;
  },

  async compareVersions(submissionId: string, v1: number, v2: number) {
    const res = await api.get(`/content/${submissionId}/compare`, {
      params: { v1, v2 },
    });
    return res.data.data;
  },

  async updateSuggestionStatus(suggestionId: string, status: 'ACCEPTED' | 'REJECTED' | 'MODIFIED', userFeedback?: string) {
    const res = await api.patch(`/corrections/${suggestionId}/status`, { status, userFeedback });
    return res.data.data;
  },

  async applyBatchCorrections(versionId: string, acceptedSuggestionIds: string[]) {
    const res = await api.post('/corrections/apply-batch', { versionId, acceptedSuggestionIds });
    return res.data.data;
  },
};

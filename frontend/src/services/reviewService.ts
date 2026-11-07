import { api } from './api';
import { ContentSubmission, ReviewComment } from '../types';

export const reviewService = {
  async getReviewQueue(): Promise<ContentSubmission[]> {
    const res = await api.get('/reviews/queue');
    return res.data.data;
  },

  async listReviews(): Promise<any[]> {
    const res = await api.get('/reviews/history');
    return res.data.data;
  },

  async submitDecision(
    submissionId: string,
    decision: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED',
    decisionSummary: string,
    notes?: string
  ) {
    const res = await api.post(`/reviews/submission/${submissionId}/decision`, {
      decision,
      decisionSummary,
      notes,
    });
    return res.data.data;
  },

  async addComment(submissionId: string, text: string, anchorText?: string): Promise<ReviewComment> {
    const res = await api.post(`/reviews/submission/${submissionId}/comment`, {
      text,
      anchorText,
    });
    return res.data.data;
  },
};

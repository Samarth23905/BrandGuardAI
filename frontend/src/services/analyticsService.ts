import { api } from './api';

export const analyticsService = {
  async getGovernanceMetrics(params?: { startDate?: string; endDate?: string; creatorId?: string; status?: string }) {
    const res = await api.get('/analytics/metrics', { params });
    return res.data.data;
  },
};

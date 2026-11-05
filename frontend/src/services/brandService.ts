import { api } from './api';
import {
  BrandGuideline,
  BrandDocument,
  ApprovedFact,
  ApprovedClaim,
  RestrictedClaim,
  TerminologyRule,
} from '../types';

export const brandService = {
  // Guidelines
  async listGuidelines(category?: string): Promise<BrandGuideline[]> {
    const res = await api.get('/brand-guidelines', { params: { category } });
    return res.data.data;
  },
  async createGuideline(data: Partial<BrandGuideline>): Promise<BrandGuideline> {
    const res = await api.post('/brand-guidelines', data);
    return res.data.data;
  },
  async updateGuideline(id: string, data: Partial<BrandGuideline>): Promise<BrandGuideline> {
    const res = await api.patch(`/brand-guidelines/${id}`, data);
    return res.data.data;
  },
  async deleteGuideline(id: string): Promise<void> {
    await api.delete(`/brand-guidelines/${id}`);
  },

  // Documents
  async listDocuments(): Promise<BrandDocument[]> {
    const res = await api.get('/documents');
    return res.data.data;
  },
  async uploadDocument(formData: FormData): Promise<BrandDocument> {
    const res = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
  async getDocument(id: string): Promise<{ document: BrandDocument; chunks: any[] }> {
    const res = await api.get(`/documents/${id}`);
    return res.data.data;
  },

  // Approved Facts
  async listFacts(category?: string): Promise<ApprovedFact[]> {
    const res = await api.get('/approved-facts', { params: { category } });
    return res.data.data;
  },
  async createFact(data: Partial<ApprovedFact>): Promise<ApprovedFact> {
    const res = await api.post('/approved-facts', data);
    return res.data.data;
  },
  async updateFact(id: string, data: Partial<ApprovedFact>): Promise<ApprovedFact> {
    const res = await api.patch(`/approved-facts/${id}`, data);
    return res.data.data;
  },
  async deleteFact(id: string): Promise<void> {
    await api.delete(`/approved-facts/${id}`);
  },

  // Approved Claims
  async listClaims(): Promise<ApprovedClaim[]> {
    const res = await api.get('/approved-claims');
    return res.data.data;
  },
  async createClaim(data: Partial<ApprovedClaim>): Promise<ApprovedClaim> {
    const res = await api.post('/approved-claims', data);
    return res.data.data;
  },
  async updateClaim(id: string, data: Partial<ApprovedClaim>): Promise<ApprovedClaim> {
    const res = await api.patch(`/approved-claims/${id}`, data);
    return res.data.data;
  },
  async deleteClaim(id: string): Promise<void> {
    await api.delete(`/approved-claims/${id}`);
  },

  // Restricted Claims
  async listRestricted(): Promise<RestrictedClaim[]> {
    const res = await api.get('/restricted-claims');
    return res.data.data;
  },
  async createRestricted(data: Partial<RestrictedClaim>): Promise<RestrictedClaim> {
    const res = await api.post('/restricted-claims', data);
    return res.data.data;
  },
  async updateRestricted(id: string, data: Partial<RestrictedClaim>): Promise<RestrictedClaim> {
    const res = await api.patch(`/restricted-claims/${id}`, data);
    return res.data.data;
  },
  async deleteRestricted(id: string): Promise<void> {
    await api.delete(`/restricted-claims/${id}`);
  },

  // Terminology Rules
  async listTerminology(termType?: string): Promise<TerminologyRule[]> {
    const res = await api.get('/terminology', { params: { termType } });
    return res.data.data;
  },
  async createTerminology(data: Partial<TerminologyRule>): Promise<TerminologyRule> {
    const res = await api.post('/terminology', data);
    return res.data.data;
  },
  async updateTerminology(id: string, data: Partial<TerminologyRule>): Promise<TerminologyRule> {
    const res = await api.patch(`/terminology/${id}`, data);
    return res.data.data;
  },
  async deleteTerminology(id: string): Promise<void> {
    await api.delete(`/terminology/${id}`);
  },
};

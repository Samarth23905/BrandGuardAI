import { api } from './api';
import { User, Organisation } from '../types';

export const authService = {
  async register(payload: { name: string; email: string; password: string; organisationName: string; industry?: string }) {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },

  async login(payload: { email: string; password: string }) {
    const res = await api.post('/auth/login', payload);
    return res.data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await api.get('/auth/me');
    return res.data.data;
  },

  async getOrganisation(): Promise<Organisation> {
    const res = await api.get('/organisations');
    return res.data.data;
  },

  async updateOrganisationSettings(settings: any): Promise<Organisation> {
    const res = await api.patch('/organisations/settings', settings);
    return res.data.data;
  },

  async getMembers(): Promise<any[]> {
    const res = await api.get('/organisations/members');
    return res.data.data;
  },

  async listUsers(): Promise<User[]> {
    const res = await api.get('/users');
    return res.data.data;
  },

  async createUser(payload: { name: string; email: string; password: string; role: string }): Promise<User> {
    const res = await api.post('/users', payload);
    return res.data.data;
  },

  async updateUser(userId: string, payload: { role?: string; isActive?: boolean }): Promise<User> {
    const res = await api.patch(`/users/${userId}`, payload);
    return res.data.data;
  },
};

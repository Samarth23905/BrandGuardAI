import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { Organisation } from '../models/Organisation';

const app = createApp();

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('Authentication and RBAC Isolation Test Suite', () => {
  let adminToken = '';
  let creatorToken = '';
  let orgId = '';

  const testEmail = `admin-test-${Date.now()}@example.com`;
  const creatorEmail = `creator-test-${Date.now()}@example.com`;

  it('Step 1: Admin can register and automatically initialize organisation', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Administrator',
        email: testEmail,
        password: 'Password123!',
        organisationName: 'Apex Health Global',
        industry: 'Biotech & Nutrition',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('ADMIN');

    adminToken = res.body.data.token;
    orgId = res.body.data.user.organisationId;
  });

  it('Step 2: Admin can log in successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testEmail);
  });

  it('Step 3: Admin can create a CREATOR account within the same organisation', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Content Creator Joe',
        email: creatorEmail,
        password: 'Password123!',
        role: 'CREATOR',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('CREATOR');
  });

  it('Step 4: Creator can login and obtain valid JWT token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: creatorEmail,
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('CREATOR');
    creatorToken = res.body.data.token;
  });

  it('Step 5: Creator is forbidden from accessing Admin-only settings (RBAC enforcement)', async () => {
    const res = await request(app)
      .patch('/api/v1/organisations/settings')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        minPassingScore: 85,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Step 6: Cross-organisation data access is strictly blocked (Organisation Isolation)', async () => {
    const fakeOtherOrgId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch('/api/v1/organisations/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        organisationId: fakeOtherOrgId.toString(),
        minPassingScore: 90,
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Cross-organisation');
  });
});

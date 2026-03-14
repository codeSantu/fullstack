import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Festivals & Members Flow (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let orgId: string;
  let createdFestivalId: string; // Used for cleanup

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Login as admin
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@ddd.com',
        password: 'Testing123!'
      });
    authToken = loginRes.body.access_token;

    // Get my organization
    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    orgId = meRes.body.organizationId;
  });

  afterAll(async () => {
    // CLEANUP: Remove the test festival from the live database
    if (createdFestivalId) {
      await request(app.getHttpServer())
        .delete(`/api/festivals/${createdFestivalId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-organization-id', orgId);
    }
    await app.close();
  });

  describe('FestivalsModule', () => {
    it('/api/festivals (GET)', () => {
      const req = request(app.getHttpServer()).get('/api/festivals');
      if (orgId) req.set('x-organization-id', orgId);
      return req.set('Authorization', `Bearer ${authToken}`).expect(200);
    });

    it('/api/festivals (POST)', async () => {
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 1); // Fix: End date is tomorrow

      const payload = {
        title: `E2E Fest ${Date.now()}`,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        location: 'E2E Testing Grounds',
        description: 'Automated E2E Test Festival'
      };

      const req = request(app.getHttpServer())
        .post('/api/festivals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);

      if (orgId) req.set('x-organization-id', orgId);

      const res = await req;

      if (res.status === 201) {
        createdFestivalId = res.body.id; // Capture ID for deletion
      } else {
        console.error('FESTIVAL POST ERROR:', JSON.stringify(res.body, null, 2));
      }

      expect(res.status).toBe(201);
    });
  });

  describe('PujaModule', () => {
    it('/api/puja/current (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/puja/current')
        .expect(200);
    });
  });

  describe('MembersModule', () => {
    it('/api/members (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/members')
        .expect(200);
    });
  });
});
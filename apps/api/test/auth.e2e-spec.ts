import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Auth & User Flow (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('AuthModule', () => {
    it('/api/auth/login (POST) - Valid Admin Login', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@ddd.com',
          password: 'Testing123!'
        })
        .expect(201);
      
      authToken = res.body.access_token;
      expect(authToken).toBeDefined();
    });

    it('/api/auth/login (POST) - Invalid Login', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'wrong@ddd.com',
          password: 'wrong'
        })
        .expect(401);
    });

    it('/api/auth/me (GET) - Authenticated Profile', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('admin@ddd.com');
          expect(res.body.role).toBe('ADMIN');
        });
    });
  });

  describe('UsersModule', () => {
    it('/api/users (GET) - Admin Access', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});

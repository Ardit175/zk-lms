import request from 'supertest';
import { app } from '../../index';
import { createTestUser } from '../helpers/auth.helper';
import { prisma } from '../../services/prisma';
import bcrypt from 'bcryptjs';

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new student successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newstudent@test.com',
          password: 'ValidPass123!',
          firstName: 'New',
          lastName: 'Student',
          role: 'STUDENT',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newstudent@test.com');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should register a new instructor successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newinstructor@test.com',
          password: 'ValidPass123!',
          firstName: 'New',
          lastName: 'Instructor',
          role: 'INSTRUCTOR',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('INSTRUCTOR');

      // Check that instructor profile was created
      const profile = await prisma.instructorProfile.findUnique({
        where: { userId: response.body.data.user.id },
      });
      expect(profile).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await createTestUser('STUDENT', { email: 'duplicate@test.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@test.com',
          password: 'ValidPass123!',
          firstName: 'Dup',
          lastName: 'User',
          role: 'STUDENT',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'weak@test.com',
          password: '123',
          firstName: 'Weak',
          lastName: 'Pass',
          role: 'STUDENT',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'ValidPass123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'STUDENT',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const password = 'TestPassword123!';
      const passwordHash = await bcrypt.hash(password, 10);

      await prisma.user.create({
        data: {
          email: 'login@test.com',
          passwordHash,
          firstName: 'Login',
          lastName: 'User',
          role: 'STUDENT',
          isActive: true,
        },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'TestPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('login@test.com');
    });

    it('should reject incorrect password', async () => {
      await createTestUser('STUDENT', { email: 'wrongpass@test.com', password: 'CorrectPass123!' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@test.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'SomePassword123!',
        });

      expect(response.status).toBe(401);
    });

    it('should reject inactive user', async () => {
      await createTestUser('STUDENT', { email: 'inactive@test.com', isActive: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@test.com',
          password: 'TestPassword123!',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const user = await createTestUser('STUDENT');

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe(user.email);
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});

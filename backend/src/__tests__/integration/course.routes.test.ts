import request from 'supertest';
import { app } from '../../index';
import {
  createTestUser,
  createTestCourse,
  createTestCategory,
  createTestModule,
  createTestLesson,
} from '../helpers/auth.helper';

describe('Course Routes', () => {
  describe('GET /api/courses', () => {
    it('should return only published courses', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      await createTestCourse(instructor.id, { status: 'PUBLISHED', title: 'Published Course' });
      await createTestCourse(instructor.id, { status: 'DRAFT', title: 'Draft Course' });

      const response = await request(app).get('/api/courses');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Published Course');
    });

    it('should filter by category', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const category1 = await createTestCategory('Web Dev');
      const category2 = await createTestCategory('Data Science');

      await createTestCourse(instructor.id, { status: 'PUBLISHED', title: 'Web Course', categoryId: category1.id });
      await createTestCourse(instructor.id, { status: 'PUBLISHED', title: 'Data Course', categoryId: category2.id });

      const response = await request(app).get(`/api/courses?category=${category1.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Web Course');
    });

    it('should search by title', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      await createTestCourse(instructor.id, { status: 'PUBLISHED', title: 'React Fundamentals' });
      await createTestCourse(instructor.id, { status: 'PUBLISHED', title: 'Node.js Basics' });

      const response = await request(app).get('/api/courses?search=React');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toContain('React');
    });
  });

  describe('GET /api/courses/:slug', () => {
    it('should return course details with modules preview', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const course = await createTestCourse(instructor.id, { status: 'PUBLISHED' });
      const module = await createTestModule(course.id);
      await createTestLesson(module.id);

      const response = await request(app).get(`/api/courses/${course.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe(course.title);
      expect(response.body.data.modules).toBeDefined();
    });

    it('should return 404 for non-existent course', async () => {
      const response = await request(app).get('/api/courses/non-existent-slug');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/courses', () => {
    it('should create course for instructor', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const category = await createTestCategory('Test Category');

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructor.token}`)
        .send({
          title: 'New Test Course',
          description: 'A test course description that is long enough',
          categoryId: category.id,
          level: 'BEGINNER',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe('New Test Course');
      expect(response.body.data.status).toBe('DRAFT');
      expect(response.body.data.instructorId).toBe(instructor.id);
    });

    it('should reject course creation for student', async () => {
      const student = await createTestUser('STUDENT');

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          title: 'Student Course',
          description: 'A test course description',
          level: 'BEGINNER',
        });

      expect(response.status).toBe(403);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/courses')
        .send({
          title: 'Unauthenticated Course',
          description: 'A test course description',
          level: 'BEGINNER',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/courses/:id', () => {
    it('should update own course', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const course = await createTestCourse(instructor.id);

      const response = await request(app)
        .put(`/api/courses/${course.id}`)
        .set('Authorization', `Bearer ${instructor.token}`)
        .send({
          title: 'Updated Course Title',
          description: 'Updated description that is long enough',
          level: 'INTERMEDIATE',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Course Title');
    });

    it('should reject update of another instructor\'s course', async () => {
      const instructor1 = await createTestUser('INSTRUCTOR');
      const instructor2 = await createTestUser('INSTRUCTOR');
      const course = await createTestCourse(instructor1.id);

      const response = await request(app)
        .put(`/api/courses/${course.id}`)
        .set('Authorization', `Bearer ${instructor2.token}`)
        .send({
          title: 'Hijacked Course',
          description: 'Trying to update someone else\'s course',
          level: 'BEGINNER',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/courses/:id/status', () => {
    it('should submit course for review (DRAFT → PENDING_REVIEW)', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const course = await createTestCourse(instructor.id, { status: 'DRAFT' });

      const response = await request(app)
        .patch(`/api/courses/${course.id}/status`)
        .set('Authorization', `Bearer ${instructor.token}`)
        .send({ status: 'PENDING_REVIEW' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('PENDING_REVIEW');
    });

    it('should allow admin to publish course', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const admin = await createTestUser('ADMIN');
      const course = await createTestCourse(instructor.id, { status: 'PENDING_REVIEW' });

      const response = await request(app)
        .patch(`/api/courses/${course.id}/status`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ status: 'PUBLISHED' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('PUBLISHED');
    });

    it('should reject instructor publishing own course', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const course = await createTestCourse(instructor.id, { status: 'PENDING_REVIEW' });

      const response = await request(app)
        .patch(`/api/courses/${course.id}/status`)
        .set('Authorization', `Bearer ${instructor.token}`)
        .send({ status: 'PUBLISHED' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/courses/:id', () => {
    it('should archive own course', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const course = await createTestCourse(instructor.id);

      const response = await request(app)
        .delete(`/api/courses/${course.id}`)
        .set('Authorization', `Bearer ${instructor.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('ARCHIVED');
    });

    it('should reject deleting another instructor\'s course', async () => {
      const instructor1 = await createTestUser('INSTRUCTOR');
      const instructor2 = await createTestUser('INSTRUCTOR');
      const course = await createTestCourse(instructor1.id);

      const response = await request(app)
        .delete(`/api/courses/${course.id}`)
        .set('Authorization', `Bearer ${instructor2.token}`);

      expect(response.status).toBe(403);
    });
  });
});

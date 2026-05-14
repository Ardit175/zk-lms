import request from 'supertest';
import { app } from '../../index';
import {
  createTestUser,
  createTestCourse,
  createTestModule,
  createTestLesson,
  createTestEnrollment,
} from '../helpers/auth.helper';
import { prisma } from '../../services/prisma';

describe('Enrollment Routes', () => {
  describe('POST /api/enrollments', () => {
    it('should enroll student in a published course', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course = await createTestCourse(instructor.id, { status: 'PUBLISHED' });

      const response = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${student.token}`)
        .send({ courseId: course.id });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.courseId).toBe(course.id);
      expect(response.body.data.studentId).toBe(student.id);

      // Verify enrollment count was incremented
      const updatedCourse = await prisma.course.findUnique({
        where: { id: course.id },
      });
      expect(updatedCourse?.enrollmentCount).toBe(1);
    });

    it('should reject enrollment in unpublished course', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course = await createTestCourse(instructor.id, { status: 'DRAFT' });

      const response = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${student.token}`)
        .send({ courseId: course.id });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate enrollment', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course = await createTestCourse(instructor.id, { status: 'PUBLISHED' });

      await createTestEnrollment(student.id, course.id);

      const response = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${student.token}`)
        .send({ courseId: course.id });

      expect(response.status).toBe(400);
    });

    it('should return 401 when not authenticated', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const course = await createTestCourse(instructor.id, { status: 'PUBLISHED' });

      const response = await request(app)
        .post('/api/enrollments')
        .send({ courseId: course.id });

      expect(response.status).toBe(401);
    });

    it('should return 403 when instructor tries to enroll', async () => {
      const instructor1 = await createTestUser('INSTRUCTOR');
      const instructor2 = await createTestUser('INSTRUCTOR');
      const course = await createTestCourse(instructor1.id, { status: 'PUBLISHED' });

      const response = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${instructor2.token}`)
        .send({ courseId: course.id });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/enrollments/my-courses', () => {
    it('should return student enrollments', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course1 = await createTestCourse(instructor.id, { status: 'PUBLISHED', title: 'Course 1' });
      const course2 = await createTestCourse(instructor.id, { status: 'PUBLISHED', title: 'Course 2' });

      await createTestEnrollment(student.id, course1.id);
      await createTestEnrollment(student.id, course2.id);

      const response = await request(app)
        .get('/api/enrollments/my-courses')
        .set('Authorization', `Bearer ${student.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course1 = await createTestCourse(instructor.id, { status: 'PUBLISHED', title: 'Course 1' });
      const course2 = await createTestCourse(instructor.id, { status: 'PUBLISHED', title: 'Course 2' });

      await createTestEnrollment(student.id, course1.id);
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          courseId: course2.id,
          status: 'COMPLETED',
        },
      });

      const response = await request(app)
        .get('/api/enrollments/my-courses?status=ACTIVE')
        .set('Authorization', `Bearer ${student.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/enrollments/:courseId/progress', () => {
    it('should return detailed progress for enrolled student', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course = await createTestCourse(instructor.id, { status: 'PUBLISHED' });
      const module = await createTestModule(course.id);
      await createTestLesson(module.id, 0);
      await createTestLesson(module.id, 1);

      await createTestEnrollment(student.id, course.id);

      const response = await request(app)
        .get(`/api/enrollments/${course.id}/progress`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.modules).toBeDefined();
      expect(response.body.data.overallProgress).toBeDefined();
    });

    it('should return 404 when not enrolled', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course = await createTestCourse(instructor.id, { status: 'PUBLISHED' });

      const response = await request(app)
        .get(`/api/enrollments/${course.id}/progress`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/enrollments/:courseId/lessons/:lessonId/complete', () => {
    it('should mark lesson as complete', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course = await createTestCourse(instructor.id, { status: 'PUBLISHED' });
      const module = await createTestModule(course.id);
      const lesson = await createTestLesson(module.id);

      await createTestEnrollment(student.id, course.id);

      const response = await request(app)
        .patch(`/api/enrollments/${course.id}/lessons/${lesson.id}/complete`)
        .set('Authorization', `Bearer ${student.token}`)
        .send({ watchedSeconds: 120 });

      expect(response.status).toBe(200);
      expect(response.body.data.lessonProgress.isCompleted).toBe(true);
    });

    it('should update progress percentage correctly', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course = await createTestCourse(instructor.id, { status: 'PUBLISHED' });
      const module = await createTestModule(course.id);
      const lesson1 = await createTestLesson(module.id, 0);
      const lesson2 = await createTestLesson(module.id, 1);

      const enrollment = await createTestEnrollment(student.id, course.id);

      // Complete first lesson
      await request(app)
        .patch(`/api/enrollments/${course.id}/lessons/${lesson1.id}/complete`)
        .set('Authorization', `Bearer ${student.token}`);

      const updatedEnrollment = await prisma.enrollment.findUnique({
        where: { id: enrollment.id },
      });

      expect(updatedEnrollment?.progressPercent).toBe(50);
    });

    it('should mark course as completed when all lessons done', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course = await createTestCourse(instructor.id, { status: 'PUBLISHED' });
      const module = await createTestModule(course.id);
      const lesson = await createTestLesson(module.id);

      await createTestEnrollment(student.id, course.id);

      const response = await request(app)
        .patch(`/api/enrollments/${course.id}/lessons/${lesson.id}/complete`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.courseCompleted).toBe(true);

      // Verify certificate was created
      const certificate = await prisma.certificate.findFirst({
        where: { studentId: student.id },
      });
      expect(certificate).toBeDefined();
    });

    it('should update streak days', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course = await createTestCourse(instructor.id, { status: 'PUBLISHED' });
      const module = await createTestModule(course.id);
      const lesson = await createTestLesson(module.id);

      await createTestEnrollment(student.id, course.id);

      await request(app)
        .patch(`/api/enrollments/${course.id}/lessons/${lesson.id}/complete`)
        .set('Authorization', `Bearer ${student.token}`);

      const profile = await prisma.studentProfile.findUnique({
        where: { userId: student.id },
      });

      expect(profile?.streakDays).toBe(1);
      expect(profile?.lastStudiedAt).toBeDefined();
    });
  });
});

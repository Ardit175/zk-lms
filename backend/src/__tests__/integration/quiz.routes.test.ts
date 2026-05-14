import request from 'supertest';
import { app } from '../../index';
import {
  createTestUser,
  createTestCourse,
  createTestModule,
  createTestLesson,
  createTestEnrollment,
  createTestQuiz,
} from '../helpers/auth.helper';
import { prisma } from '../../services/prisma';

describe('Quiz Routes', () => {
  describe('POST /api/quizzes/:id/attempts', () => {
    it('should start a quiz attempt for enrolled student', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course = await createTestCourse(instructor.id, { status: 'PUBLISHED' });
      const module = await createTestModule(course.id);
      const lesson = await createTestLesson(module.id, 0, 'QUIZ');
      const quiz = await createTestQuiz(lesson.id);

      await createTestEnrollment(student.id, course.id);

      const response = await request(app)
        .post(`/api/quizzes/${quiz.id}/attempts`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(response.status).toBe(201);
      expect(response.body.data.attempt).toBeDefined();
      expect(response.body.data.questions).toBeDefined();
      expect(response.body.data.attempt.attemptNumber).toBe(1);
    });

    it('should reject when not enrolled', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course = await createTestCourse(instructor.id, { status: 'PUBLISHED' });
      const module = await createTestModule(course.id);
      const lesson = await createTestLesson(module.id, 0, 'QUIZ');
      const quiz = await createTestQuiz(lesson.id);

      const response = await request(app)
        .post(`/api/quizzes/${quiz.id}/attempts`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(response.status).toBe(403);
    });

    it('should reject when max attempts exceeded', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course = await createTestCourse(instructor.id, { status: 'PUBLISHED' });
      const module = await createTestModule(course.id);
      const lesson = await createTestLesson(module.id, 0, 'QUIZ');
      const quiz = await createTestQuiz(lesson.id);

      await createTestEnrollment(student.id, course.id);

      // Create max attempts (3)
      for (let i = 1; i <= 3; i++) {
        await prisma.quizAttempt.create({
          data: {
            quizId: quiz.id,
            studentId: student.id,
            attemptNumber: i,
            completedAt: new Date(),
            score: 50,
            isPassed: false,
          },
        });
      }

      const response = await request(app)
        .post(`/api/quizzes/${quiz.id}/attempts`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/quizzes/attempts/:id/submit', () => {
    it('should calculate score correctly', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course = await createTestCourse(instructor.id, { status: 'PUBLISHED' });
      const module = await createTestModule(course.id);
      const lesson = await createTestLesson(module.id, 0, 'QUIZ');
      const quiz = await createTestQuiz(lesson.id);

      await createTestEnrollment(student.id, course.id);

      // Start attempt
      const startResponse = await request(app)
        .post(`/api/quizzes/${quiz.id}/attempts`)
        .set('Authorization', `Bearer ${student.token}`);

      const attemptId = startResponse.body.data.attempt.id;
      const question = startResponse.body.data.questions[0];

      // Get correct option
      const correctOption = await prisma.quizOption.findFirst({
        where: { questionId: question.id, isCorrect: true },
      });

      // Submit with correct answer
      const submitResponse = await request(app)
        .post(`/api/quizzes/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          answers: [
            { questionId: question.id, selectedOptionId: correctOption?.id },
          ],
        });

      expect(submitResponse.status).toBe(200);
      expect(submitResponse.body.data.attempt.score).toBe(100);
      expect(submitResponse.body.data.attempt.isPassed).toBe(true);
    });

    it('should mark as failed when below passing score', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course = await createTestCourse(instructor.id, { status: 'PUBLISHED' });
      const module = await createTestModule(course.id);
      const lesson = await createTestLesson(module.id, 0, 'QUIZ');
      const quiz = await createTestQuiz(lesson.id);

      await createTestEnrollment(student.id, course.id);

      // Start attempt
      const startResponse = await request(app)
        .post(`/api/quizzes/${quiz.id}/attempts`)
        .set('Authorization', `Bearer ${student.token}`);

      const attemptId = startResponse.body.data.attempt.id;
      const question = startResponse.body.data.questions[0];

      // Get wrong option
      const wrongOption = await prisma.quizOption.findFirst({
        where: { questionId: question.id, isCorrect: false },
      });

      // Submit with wrong answer
      const submitResponse = await request(app)
        .post(`/api/quizzes/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          answers: [
            { questionId: question.id, selectedOptionId: wrongOption?.id },
          ],
        });

      expect(submitResponse.status).toBe(200);
      expect(submitResponse.body.data.attempt.score).toBe(0);
      expect(submitResponse.body.data.attempt.isPassed).toBe(false);
    });
  });

  describe('GET /api/quizzes/:id/my-attempts', () => {
    it('should return student attempt history', async () => {
      const instructor = await createTestUser('INSTRUCTOR');
      const student = await createTestUser('STUDENT');
      const course = await createTestCourse(instructor.id, { status: 'PUBLISHED' });
      const module = await createTestModule(course.id);
      const lesson = await createTestLesson(module.id, 0, 'QUIZ');
      const quiz = await createTestQuiz(lesson.id);

      await createTestEnrollment(student.id, course.id);

      // Create some attempts
      await prisma.quizAttempt.createMany({
        data: [
          { quizId: quiz.id, studentId: student.id, attemptNumber: 1, score: 60, isPassed: false, completedAt: new Date() },
          { quizId: quiz.id, studentId: student.id, attemptNumber: 2, score: 80, isPassed: true, completedAt: new Date() },
        ],
      });

      const response = await request(app)
        .get(`/api/quizzes/${quiz.id}/my-attempts`)
        .set('Authorization', `Bearer ${student.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });
});

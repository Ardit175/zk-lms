import { prisma } from '../services/prisma';
import { afterAll, afterEach, beforeAll, beforeEach } from '@jest/globals';

const resetTestDatabase = async (): Promise<void> => {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "QuizAnswer",
      "QuizAttempt",
      "QuizOption",
      "QuizQuestion",
      "Quiz",
      "AssignmentSubmission",
      "Assignment",
      "LiveQuestion",
      "LiveSession",
      "LessonProgress",
      "Lesson",
      "Module",
      "Certificate",
      "Enrollment",
      "Notification",
      "Course",
      "Category",
      "InstructorProfile",
      "StudentProfile",
      "User"
    RESTART IDENTITY CASCADE;
  `);
};

beforeAll(async () => {
  // Ensure database connection is established
  await prisma.$connect();
});

beforeEach(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  await resetTestDatabase();
});

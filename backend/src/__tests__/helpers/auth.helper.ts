import { prisma } from '../../services/prisma';
import { generateToken, JwtPayload } from '../../lib/jwt';
import bcrypt from 'bcryptjs';

type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  token: string;
}

let userCounter = 0;

export function generateTestToken(payload: Partial<JwtPayload> & { id: string; role: Role }): string {
  const fullPayload: JwtPayload = {
    id: payload.id,
    email: payload.email || `test${Date.now()}@test.com`,
    role: payload.role,
    firstName: payload.firstName || 'Test',
    lastName: payload.lastName || 'User',
  };
  return generateToken(fullPayload);
}

export async function createTestUser(role: Role, overrides: Partial<{
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  isActive: boolean;
}> = {}): Promise<TestUser> {
  userCounter++;
  const timestamp = Date.now();

  const email = overrides.email || `test${role.toLowerCase()}${userCounter}${timestamp}@test.com`;
  const firstName = overrides.firstName || 'Test';
  const lastName = overrides.lastName || `${role}${userCounter}`;
  const password = overrides.password || 'TestPassword123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      isActive: overrides.isActive ?? true,
      isEmailVerified: true,
    },
  });

  // Create role-specific profile
  if (role === 'INSTRUCTOR') {
    await prisma.instructorProfile.create({
      data: {
        userId: user.id,
        bio: 'Test instructor bio',
        expertise: ['Testing', 'Development'],
      },
    });
  } else if (role === 'STUDENT') {
    await prisma.studentProfile.create({
      data: {
        userId: user.id,
        learningGoals: 'Test learning goals',
      },
    });
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    token,
  };
}

export async function createTestCategory(name?: string) {
  const timestamp = Date.now();
  const categoryName = name || `Test Category ${timestamp}`;

  return prisma.category.create({
    data: {
      name: categoryName,
      slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
    },
  });
}

export async function createTestCourse(instructorId: string, overrides: Partial<{
  title: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  categoryId: string;
}> = {}) {
  const timestamp = Date.now();
  const title = overrides.title || `Test Course ${timestamp}`;

  return prisma.course.create({
    data: {
      title,
      description: 'Test course description',
      slug: title.toLowerCase().replace(/\s+/g, '-'),
      instructorId,
      status: overrides.status || 'DRAFT',
      categoryId: overrides.categoryId,
      level: 'BEGINNER',
    },
  });
}

export async function createTestModule(courseId: string, orderIndex = 0) {
  return prisma.module.create({
    data: {
      courseId,
      title: `Test Module ${orderIndex + 1}`,
      description: 'Test module description',
      orderIndex,
      isPublished: true,
    },
  });
}

export async function createTestLesson(moduleId: string, orderIndex = 0, type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT' = 'TEXT') {
  return prisma.lesson.create({
    data: {
      moduleId,
      title: `Test Lesson ${orderIndex + 1}`,
      content: '<p>Test lesson content</p>',
      orderIndex,
      type,
      isPublished: true,
    },
  });
}

export async function createTestEnrollment(studentId: string, courseId: string) {
  return prisma.enrollment.create({
    data: {
      studentId,
      courseId,
      status: 'ACTIVE',
    },
  });
}

export async function createTestQuiz(lessonId: string) {
  const quiz = await prisma.quiz.create({
    data: {
      lessonId,
      title: 'Test Quiz',
      description: 'Test quiz description',
      passingScore: 70,
      maxAttempts: 3,
    },
  });

  const question = await prisma.quizQuestion.create({
    data: {
      quizId: quiz.id,
      questionText: 'What is 2 + 2?',
      type: 'MULTIPLE_CHOICE',
      orderIndex: 0,
      points: 1,
    },
  });

  await prisma.quizOption.createMany({
    data: [
      { questionId: question.id, optionText: '3', isCorrect: false },
      { questionId: question.id, optionText: '4', isCorrect: true },
      { questionId: question.id, optionText: '5', isCorrect: false },
    ],
  });

  return quiz;
}

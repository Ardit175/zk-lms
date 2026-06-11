import { prisma } from '../services/prisma';

// Safety guard: this suite truncates every table after each test. Refuse to run
// against anything that doesn't clearly look like a disposable test database, so
// pointing DATABASE_URL at staging/production can never wipe real data.
const dbUrl = process.env.DATABASE_URL || '';
if (process.env.NODE_ENV !== 'test' || !/test/i.test(dbUrl)) {
  throw new Error(
    'Refusing to run tests: NODE_ENV must be "test" and DATABASE_URL must reference a test database ' +
      '(its name/URL should contain "test"). This prevents the cleanup hooks from wiping real data.'
  );
}

beforeAll(async () => {
  // Ensure database connection is established
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Clean up test data after each test
afterEach(async () => {
  // Delete in order respecting foreign key constraints
  await prisma.quizAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quizOption.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.liveQuestion.deleteMany();
  await prisma.liveSession.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.instructorProfile.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();
});

/**
 * One-off seed: adds a VIDEO, a PDF, and a QUIZ lesson to the Python course's
 * first module so we can verify those player flows end-to-end.
 *
 * Idempotent: re-running drops the test lessons (and their cascaded quiz/options
 * data) and recreates them.
 *
 * Run with: cd backend && npx ts-node prisma/seed-test-content.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/zklms',
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const TEST_IDS = ['test-video-lesson', 'test-pdf-lesson', 'test-quiz-lesson'];

async function main() {
  const course = await prisma.course.findFirst({
    where: { title: { contains: 'Python', mode: 'insensitive' } },
    include: { modules: { orderBy: { orderIndex: 'asc' } } },
  });
  if (!course) throw new Error('Python course not found — run `npm run prisma:seed` first');

  const firstModule = course.modules[0];

  // Wipe any prior test fixtures so re-runs stay clean (cascades: Quiz → Questions → Options).
  await prisma.lesson.deleteMany({ where: { id: { in: TEST_IDS } } });

  await prisma.lesson.create({
    data: {
      id: 'test-video-lesson',
      moduleId: firstModule.id,
      title: 'Intro Video (YouTube)',
      type: 'VIDEO',
      videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      videoType: 'YOUTUBE',
      duration: 19,
      orderIndex: 100,
      isPublished: true,
    },
  });

  await prisma.lesson.create({
    data: {
      id: 'test-pdf-lesson',
      moduleId: firstModule.id,
      title: 'Reference PDF',
      type: 'TEXT',
      pdfUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
      orderIndex: 101,
      isPublished: true,
    },
  });

  await prisma.lesson.create({
    data: {
      id: 'test-quiz-lesson',
      moduleId: firstModule.id,
      title: 'Knowledge Check',
      type: 'QUIZ',
      orderIndex: 102,
      isPublished: true,
    },
  });

  await prisma.quiz.create({
    data: {
      lessonId: 'test-quiz-lesson',
      title: 'Python Basics Quiz',
      description: 'Quick check on basic Python concepts.',
      passingScore: 70,
      maxAttempts: 3,
      questions: {
        create: [
          {
            questionText: 'Which of these is a mutable type in Python?',
            type: 'MULTIPLE_CHOICE',
            orderIndex: 0,
            points: 1,
            explanation: 'Lists are mutable; tuples, strings and ints are not.',
            options: {
              create: [
                { optionText: 'tuple', isCorrect: false },
                { optionText: 'list', isCorrect: true },
                { optionText: 'str', isCorrect: false },
                { optionText: 'int', isCorrect: false },
              ],
            },
          },
          {
            questionText: 'What does `len("hello")` return?',
            type: 'MULTIPLE_CHOICE',
            orderIndex: 1,
            points: 1,
            explanation: '"hello" has 5 characters.',
            options: {
              create: [
                { optionText: '4', isCorrect: false },
                { optionText: '5', isCorrect: true },
                { optionText: '6', isCorrect: false },
                { optionText: 'TypeError', isCorrect: false },
              ],
            },
          },
        ],
      },
    },
  });

  const summary = await prisma.lesson.findMany({
    where: { id: { in: TEST_IDS } },
    select: { id: true, title: true, type: true, moduleId: true },
    orderBy: { orderIndex: 'asc' },
  });

  console.log('✅ Test content seeded');
  console.log(`Course: ${course.title} (id=${course.id})`);
  console.log(`Module: ${firstModule.title} (id=${firstModule.id})`);
  console.log('Lessons:', summary);
  console.log('\nDirect URLs (as a student):');
  for (const l of summary) {
    console.log(`  ${l.type.padEnd(10)} ${l.title.padEnd(28)} → /student/courses/${course.id}/learn/${l.id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

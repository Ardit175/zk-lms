import { prisma } from './prisma';
import { CourseStatus } from '@prisma/client';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now().toString(36);
}

export async function updateCourseDuration(courseId: string): Promise<void> {
  const lessons = await prisma.lesson.findMany({
    where: {
      module: { courseId },
    },
    select: { duration: true },
  });

  const totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);

  await prisma.course.update({
    where: { id: courseId },
    data: { totalDuration: Math.ceil(totalDuration / 60) },
  });
}

export async function verifyOwnership(courseId: string, userId: string): Promise<boolean> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  });
  return course?.instructorId === userId;
}

export async function canChangeStatus(
  currentStatus: CourseStatus,
  newStatus: CourseStatus,
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
): Promise<boolean> {
  if (role === 'ADMIN') return true;

  if (role === 'INSTRUCTOR') {
    const allowedTransitions: Record<CourseStatus, CourseStatus[]> = {
      DRAFT: ['PENDING_REVIEW'],
      PENDING_REVIEW: ['DRAFT'],
      PUBLISHED: ['ARCHIVED'],
      ARCHIVED: ['DRAFT'],
    };
    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  }

  return false;
}

export { generateSlug };

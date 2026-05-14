import { prisma } from './prisma';
import crypto from 'crypto';

function generateCode(length: number = 8): string {
  return crypto.randomBytes(length).toString('hex').toUpperCase().slice(0, length);
}

export async function generateCertificate(
  enrollmentId: string,
  studentId: string,
  courseId: string
): Promise<void> {
  const certificateNumber = `CERT-${generateCode(12)}`;
  const verificationCode = generateCode(16);

  await prisma.certificate.create({
    data: {
      enrollmentId,
      studentId,
      courseId,
      certificateNumber,
      verificationCode,
    },
  });

  // Get course title for notification
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  });

  // Create notification for student
  await prisma.notification.create({
    data: {
      userId: studentId,
      type: 'CERTIFICATE_READY',
      title: 'Certifikata juaj eshte gati!',
      body: `Urime! Keni perfunduar kursin "${course?.title}" dhe certifikata juaj eshte gati per shkarkim.`,
      relatedEntityId: enrollmentId,
      relatedEntityType: 'certificate',
    },
  });
}

import { prisma } from './prisma';
import { emitToUser } from '../lib/socket';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export const notificationService = {
  async create(input: CreateNotificationInput) {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        relatedEntityId: input.relatedEntityId,
        relatedEntityType: input.relatedEntityType,
      },
    });

    emitToUser(input.userId, 'notification:new', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      relatedEntityId: notification.relatedEntityId,
      relatedEntityType: notification.relatedEntityType,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });

    return notification;
  },

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return null;
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    emitToUser(userId, 'notification:read', { notificationId });

    return updated;
  },

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    emitToUser(userId, 'notification:allRead', {});

    return { success: true };
  },

  async getUnread(userId: string) {
    return prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getAll(userId: string, limit = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  },

  async notifyCourseApproved(instructorId: string, courseId: string, courseTitle: string) {
    return this.create({
      userId: instructorId,
      type: 'COURSE_APPROVED',
      title: 'Kursi u aprovua!',
      body: `Kursi "${courseTitle}" u aprovua dhe tani eshte publik.`,
      relatedEntityId: courseId,
      relatedEntityType: 'course',
    });
  },

  async notifyCourseRejected(instructorId: string, courseId: string, courseTitle: string, reason?: string) {
    return this.create({
      userId: instructorId,
      type: 'COURSE_REJECTED',
      title: 'Kursi u refuzua',
      body: reason || `Kursi "${courseTitle}" nuk u aprovua. Kontrolloni email per detaje.`,
      relatedEntityId: courseId,
      relatedEntityType: 'course',
    });
  },

  async notifyNewEnrollment(instructorId: string, studentName: string, courseId: string, courseTitle: string) {
    return this.create({
      userId: instructorId,
      type: 'ENROLLMENT_NEW',
      title: 'Regjistrim i ri!',
      body: `${studentName} u regjistrua ne kursin "${courseTitle}"`,
      relatedEntityId: courseId,
      relatedEntityType: 'course',
    });
  },

  async notifyAssignmentGraded(
    studentId: string,
    assignmentId: string,
    assignmentTitle: string,
    score: number
  ) {
    return this.create({
      userId: studentId,
      type: 'ASSIGNMENT_GRADED',
      title: 'Detyra u vleresua!',
      body: `Detyra "${assignmentTitle}" u vleresua me ${score} pike.`,
      relatedEntityId: assignmentId,
      relatedEntityType: 'assignment',
    });
  },

  async notifyCertificateReady(studentId: string, certificateId: string, courseTitle: string) {
    return this.create({
      userId: studentId,
      type: 'CERTIFICATE_READY',
      title: 'Certifikata gati!',
      body: `Urime! Certifikata juaj per kursin "${courseTitle}" eshte gati.`,
      relatedEntityId: certificateId,
      relatedEntityType: 'certificate',
    });
  },

  async notifyLiveStarting(studentId: string, sessionId: string, sessionTitle: string) {
    return this.create({
      userId: studentId,
      type: 'LIVE_STARTING',
      title: 'Sesion Live per 15 minuta!',
      body: `Sesioni "${sessionTitle}" fillon se shpejti.`,
      relatedEntityId: sessionId,
      relatedEntityType: 'liveSession',
    });
  },
};

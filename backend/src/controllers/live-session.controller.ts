import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import { emitToSession } from '../lib/socket';
import { CreateLiveSessionInput, AskQuestionInput } from '../validators/live-session.validator';

export const createSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const instructorId = req.user!.id;
    const { courseId, title, description, scheduledAt } = req.body as CreateLiveSessionInput;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, instructorId: true },
    });

    if (!course) {
      res.status(404).json(ApiResponse.error('Kursi nuk u gjet'));
      return;
    }

    if (course.instructorId !== instructorId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses ne kete kurs'));
      return;
    }

    const session = await prisma.liveSession.create({
      data: {
        courseId,
        instructorId,
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        status: 'SCHEDULED',
      },
      include: {
        course: { select: { id: true, title: true } },
      },
    });

    res.status(201).json(ApiResponse.success(session));
  } catch (error) {
    console.error('CreateSession error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te krijonte sesionin'));
  }
};

export const getMySessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const instructorId = req.user!.id;

    const sessions = await prisma.liveSession.findMany({
      where: { instructorId },
      orderBy: { scheduledAt: 'desc' },
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { questions: true } },
      },
    });

    res.json(ApiResponse.success(sessions));
  } catch (error) {
    console.error('GetMySessions error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte sesionet'));
  }
};

export const getUpcomingSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId, status: 'ACTIVE' },
      select: { courseId: true },
    });

    const courseIds = enrollments.map((e) => e.courseId);

    const sessions = await prisma.liveSession.findMany({
      where: {
        courseId: { in: courseIds },
        status: { in: ['SCHEDULED', 'LIVE'] },
        scheduledAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    res.json(ApiResponse.success(sessions));
  } catch (error) {
    console.error('GetUpcomingSessions error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte sesionet'));
  }
};

export const getSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.params.id as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        questions: {
          orderBy: [{ isAnswered: 'asc' }, { upvotes: 'desc' }, { askedAt: 'desc' }],
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!session) {
      res.status(404).json(ApiResponse.error('Sesioni nuk u gjet'));
      return;
    }

    if (userRole === 'INSTRUCTOR' && session.instructorId !== userId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses ne kete sesion'));
      return;
    }

    if (userRole === 'STUDENT') {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: { studentId: userId, courseId: session.courseId },
        },
      });

      if (!enrollment) {
        res.status(403).json(ApiResponse.error('Nuk jeni i regjistruar ne kete kurs'));
        return;
      }
    }

    res.json(ApiResponse.success(session));
  } catch (error) {
    console.error('GetSession error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte sesionin'));
  }
};

export const startSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.params.id as string;
    const instructorId = req.user!.id;

    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      select: { id: true, instructorId: true, status: true, title: true },
    });

    if (!session) {
      res.status(404).json(ApiResponse.error('Sesioni nuk u gjet'));
      return;
    }

    if (session.instructorId !== instructorId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses ne kete sesion'));
      return;
    }

    if (session.status !== 'SCHEDULED') {
      res.status(400).json(ApiResponse.error('Sesioni nuk mund te fillohet'));
      return;
    }

    const updated = await prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        status: 'LIVE',
        startedAt: new Date(),
      },
    });

    emitToSession(sessionId, 'session:started', {
      sessionId,
      startedAt: updated.startedAt,
    });

    res.json(ApiResponse.success(updated));
  } catch (error) {
    console.error('StartSession error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te fillonte sesionin'));
  }
};

export const endSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.params.id as string;
    const instructorId = req.user!.id;

    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      select: { id: true, instructorId: true, status: true },
    });

    if (!session) {
      res.status(404).json(ApiResponse.error('Sesioni nuk u gjet'));
      return;
    }

    if (session.instructorId !== instructorId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses ne kete sesion'));
      return;
    }

    if (session.status !== 'LIVE') {
      res.status(400).json(ApiResponse.error('Sesioni nuk eshte live'));
      return;
    }

    const updated = await prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });

    emitToSession(sessionId, 'session:ended', {
      sessionId,
      endedAt: updated.endedAt,
    });

    res.json(ApiResponse.success(updated));
  } catch (error) {
    console.error('EndSession error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te perfundonte sesionin'));
  }
};

export const askQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.params.id as string;
    const studentId = req.user!.id;
    const { questionText } = req.body as AskQuestionInput;

    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true, courseId: true },
    });

    if (!session) {
      res.status(404).json(ApiResponse.error('Sesioni nuk u gjet'));
      return;
    }

    if (session.status !== 'LIVE') {
      res.status(400).json(ApiResponse.error('Sesioni nuk eshte live'));
      return;
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId: session.courseId },
      },
    });

    if (!enrollment) {
      res.status(403).json(ApiResponse.error('Nuk jeni i regjistruar ne kete kurs'));
      return;
    }

    const question = await prisma.liveQuestion.create({
      data: {
        sessionId,
        studentId,
        questionText,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    emitToSession(sessionId, 'question:new', question);

    res.status(201).json(ApiResponse.success(question));
  } catch (error) {
    console.error('AskQuestion error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te dergonte pyetjen'));
  }
};

export const upvoteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.params.id as string;
    const questionId = req.params.qid as string;

    const question = await prisma.liveQuestion.findUnique({
      where: { id: questionId },
      select: { id: true, sessionId: true, upvotes: true },
    });

    if (!question || question.sessionId !== sessionId) {
      res.status(404).json(ApiResponse.error('Pyetja nuk u gjet'));
      return;
    }

    const updated = await prisma.liveQuestion.update({
      where: { id: questionId },
      data: { upvotes: { increment: 1 } },
    });

    emitToSession(sessionId, 'question:upvoted', {
      questionId,
      upvotes: updated.upvotes,
    });

    res.json(ApiResponse.success(updated));
  } catch (error) {
    console.error('UpvoteQuestion error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te votonte pyetjen'));
  }
};

export const markAnswered = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.params.id as string;
    const questionId = req.params.qid as string;
    const instructorId = req.user!.id;

    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      select: { id: true, instructorId: true },
    });

    if (!session) {
      res.status(404).json(ApiResponse.error('Sesioni nuk u gjet'));
      return;
    }

    if (session.instructorId !== instructorId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses'));
      return;
    }

    const question = await prisma.liveQuestion.findUnique({
      where: { id: questionId },
      select: { id: true, sessionId: true },
    });

    if (!question || question.sessionId !== sessionId) {
      res.status(404).json(ApiResponse.error('Pyetja nuk u gjet'));
      return;
    }

    const updated = await prisma.liveQuestion.update({
      where: { id: questionId },
      data: { isAnswered: true },
    });

    emitToSession(sessionId, 'question:answered', {
      questionId,
      isAnswered: true,
    });

    res.json(ApiResponse.success(updated));
  } catch (error) {
    console.error('MarkAnswered error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te shenonte si te pergjigjur'));
  }
};

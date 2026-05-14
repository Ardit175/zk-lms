import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import { notificationService } from '../services/notification.service';
import { SubmitAssignmentInput, GradeSubmissionInput } from '../validators/assignment.validator';

export const submitAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignmentId = req.params.id as string;
    const studentId = req.user!.id;
    const { content, fileUrl, linkUrl } = req.body as SubmitAssignmentInput;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      res.status(404).json(ApiResponse.error('Detyra nuk u gjet'));
      return;
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: assignment.lesson.module.course.id,
        },
      },
    });

    if (!enrollment) {
      res.status(403).json(ApiResponse.error('Nuk jeni i regjistruar ne kete kurs'));
      return;
    }

    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: { assignmentId, studentId },
      },
    });

    if (existingSubmission) {
      res.status(400).json(ApiResponse.error('Keni derguar tashme kete detyre'));
      return;
    }

    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId,
        content,
        fileUrl,
        linkUrl,
      },
    });

    res.status(201).json(ApiResponse.success(submission));
  } catch (error) {
    console.error('SubmitAssignment error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te dergonte detyren'));
  }
};

export const getMySubmission = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignmentId = req.params.id as string;
    const studentId = req.user!.id;

    const submission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: { assignmentId, studentId },
      },
      include: {
        gradedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    res.json(ApiResponse.success(submission));
  } catch (error) {
    console.error('GetMySubmission error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte dergesen'));
  }
};

export const getAssignmentSubmissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignmentId = req.params.id as string;
    const instructorId = req.user!.id;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: { select: { instructorId: true } },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      res.status(404).json(ApiResponse.error('Detyra nuk u gjet'));
      return;
    }

    if (assignment.lesson.module.course.instructorId !== instructorId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses ne kete detyre'));
      return;
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      orderBy: { submittedAt: 'desc' },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
      },
    });

    const stats = {
      total: submissions.length,
      graded: submissions.filter((s) => s.gradedAt !== null).length,
      ungraded: submissions.filter((s) => s.gradedAt === null).length,
      averageScore:
        submissions.filter((s) => s.score !== null).length > 0
          ? Math.round(
              submissions
                .filter((s) => s.score !== null)
                .reduce((sum, s) => sum + (s.score || 0), 0) /
                submissions.filter((s) => s.score !== null).length
            )
          : null,
    };

    res.json(ApiResponse.success({ submissions, stats, assignment }));
  } catch (error) {
    console.error('GetAssignmentSubmissions error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte dergesat'));
  }
};

export const gradeSubmission = async (req: Request, res: Response): Promise<void> => {
  try {
    const submissionId = req.params.id as string;
    const instructorId = req.user!.id;
    const { score, feedback } = req.body as GradeSubmissionInput;

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            lesson: {
              include: {
                module: {
                  include: {
                    course: { select: { instructorId: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!submission) {
      res.status(404).json(ApiResponse.error('Dergesa nuk u gjet'));
      return;
    }

    if (submission.assignment.lesson.module.course.instructorId !== instructorId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses'));
      return;
    }

    if (score > submission.assignment.maxScore) {
      res.status(400).json(ApiResponse.error(`Rezultati maksimal eshte ${submission.assignment.maxScore}`));
      return;
    }

    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score,
        feedback,
        gradedAt: new Date(),
        gradedById: instructorId,
      },
    });

    await notificationService.notifyAssignmentGraded(
      submission.studentId,
      submission.assignmentId,
      submission.assignment.title,
      score
    );

    res.json(ApiResponse.success(updated));
  } catch (error) {
    console.error('GradeSubmission error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te vleresonte'));
  }
};

export const getAssignmentByLesson = async (req: Request, res: Response): Promise<void> => {
  try {
    const lessonId = req.params.lessonId as string;
    const studentId = req.user!.id;

    const assignment = await prisma.assignment.findUnique({
      where: { lessonId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      res.status(404).json(ApiResponse.error('Detyra nuk u gjet'));
      return;
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: assignment.lesson.module.course.id,
        },
      },
    });

    if (!enrollment) {
      res.status(403).json(ApiResponse.error('Nuk jeni i regjistruar ne kete kurs'));
      return;
    }

    res.json(ApiResponse.success({
      id: assignment.id,
      lessonId: assignment.lessonId,
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions,
      dueDate: assignment.dueDate,
      maxScore: assignment.maxScore,
      submissionType: assignment.submissionType,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    }));
  } catch (error) {
    console.error('GetAssignmentByLesson error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte detyren'));
  }
};

export const getCourseAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId as string;
    const instructorId = req.user!.id;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, instructorId: true, title: true },
    });

    if (!course) {
      res.status(404).json(ApiResponse.error('Kursi nuk u gjet'));
      return;
    }

    if (course.instructorId !== instructorId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses'));
      return;
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        lesson: {
          module: { courseId },
        },
      },
      include: {
        lesson: {
          select: { title: true },
        },
        _count: {
          select: { submissions: true },
        },
        submissions: {
          select: { score: true, gradedAt: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const result = assignments.map((a) => ({
      id: a.id,
      title: a.title,
      lessonTitle: a.lesson.title,
      dueDate: a.dueDate,
      maxScore: a.maxScore,
      submissionType: a.submissionType,
      totalSubmissions: a._count.submissions,
      gradedCount: a.submissions.filter((s) => s.gradedAt !== null).length,
      ungradedCount: a.submissions.filter((s) => s.gradedAt === null).length,
      averageScore:
        a.submissions.filter((s) => s.score !== null).length > 0
          ? Math.round(
              a.submissions.filter((s) => s.score !== null).reduce((sum, s) => sum + (s.score || 0), 0) /
                a.submissions.filter((s) => s.score !== null).length
            )
          : null,
    }));

    res.json(ApiResponse.success({ assignments: result, courseTitle: course.title }));
  } catch (error) {
    console.error('GetCourseAssignments error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte detyrat'));
  }
};

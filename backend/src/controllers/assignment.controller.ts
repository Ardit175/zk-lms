import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import { notificationService } from '../services/notification.service';
import {
  SubmitAssignmentInput,
  GradeSubmissionInput,
  CreateAssignmentInput,
  UpdateAssignmentInput,
} from '../validators/assignment.validator';

/** Resolve the owning instructor of the course a lesson belongs to. */
async function getLessonOwner(lessonId: string): Promise<string | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { course: { select: { instructorId: true } } } } },
  });
  return lesson?.module.course.instructorId ?? null;
}

// ─── INSTRUCTOR: ASSIGNMENT AUTHORING ─────────────────────────────────────────

export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const instructorId = req.user!.id;
    const { lessonId, title, description, instructions, dueDate, maxScore, submissionType } =
      req.body as CreateAssignmentInput;

    const ownerId = await getLessonOwner(lessonId);
    if (ownerId === null) {
      res.status(404).json(ApiResponse.error('Mesimi nuk u gjet'));
      return;
    }
    if (ownerId !== instructorId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses ne kete mesim'));
      return;
    }

    // A lesson holds at most one assignment (lessonId is unique).
    const existing = await prisma.assignment.findUnique({ where: { lessonId } });
    if (existing) {
      res.status(400).json(ApiResponse.error('Ky mesim ka tashme nje detyre'));
      return;
    }

    const assignment = await prisma.assignment.create({
      data: {
        lessonId,
        title,
        description,
        instructions,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore,
        submissionType,
      },
    });

    res.status(201).json(ApiResponse.success(assignment));
  } catch (error) {
    console.error('CreateAssignment error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te krijonte detyren'));
  }
};

export const updateAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignmentId = req.params.id as string;
    const instructorId = req.user!.id;
    const data = req.body as UpdateAssignmentInput;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { lesson: { include: { module: { include: { course: { select: { instructorId: true } } } } } } },
    });

    if (!assignment) {
      res.status(404).json(ApiResponse.error('Detyra nuk u gjet'));
      return;
    }
    if (assignment.lesson.module.course.instructorId !== instructorId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses ne kete detyre'));
      return;
    }

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.instructions !== undefined && { instructions: data.instructions }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.maxScore !== undefined && { maxScore: data.maxScore }),
        ...(data.submissionType !== undefined && { submissionType: data.submissionType }),
      },
    });

    res.json(ApiResponse.success(updated));
  } catch (error) {
    console.error('UpdateAssignment error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te perditesonte detyren'));
  }
};

export const deleteAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignmentId = req.params.id as string;
    const instructorId = req.user!.id;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { lesson: { include: { module: { include: { course: { select: { instructorId: true } } } } } } },
    });

    if (!assignment) {
      res.status(404).json(ApiResponse.error('Detyra nuk u gjet'));
      return;
    }
    if (assignment.lesson.module.course.instructorId !== instructorId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses ne kete detyre'));
      return;
    }

    // Remove submissions first (no cascade defined on Assignment → Submission).
    await prisma.assignmentSubmission.deleteMany({ where: { assignmentId } });
    await prisma.assignment.delete({ where: { id: assignmentId } });

    res.json(ApiResponse.success({ message: 'Detyra u fshi me sukses' }));
  } catch (error) {
    console.error('DeleteAssignment error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te fshinte detyren'));
  }
};

/** Instructor-side fetch of a lesson's assignment for editing (owner only). */
export const getAssignmentForEdit = async (req: Request, res: Response): Promise<void> => {
  try {
    const lessonId = req.params.lessonId as string;
    const instructorId = req.user!.id;

    const assignment = await prisma.assignment.findUnique({
      where: { lessonId },
      include: { lesson: { include: { module: { include: { course: { select: { instructorId: true } } } } } } },
    });

    if (!assignment) {
      // Not an error — the lesson simply has no assignment yet.
      res.json(ApiResponse.success(null));
      return;
    }
    if (assignment.lesson.module.course.instructorId !== instructorId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses ne kete detyre'));
      return;
    }

    const { lesson: _lesson, ...rest } = assignment;
    res.json(ApiResponse.success(rest));
  } catch (error) {
    console.error('GetAssignmentForEdit error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte detyren'));
  }
};

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

    type SubmissionStat = { gradedAt: Date | null; score: number | null };
    const stats = {
      total: submissions.length,
      graded: submissions.filter((s: SubmissionStat) => s.gradedAt !== null).length,
      ungraded: submissions.filter((s: SubmissionStat) => s.gradedAt === null).length,
      averageScore:
        submissions.filter((s: SubmissionStat) => s.score !== null).length > 0
          ? Math.round(
              submissions
                .filter((s: SubmissionStat) => s.score !== null)
                .reduce((sum: number, s: SubmissionStat) => sum + (s.score || 0), 0) /
                submissions.filter((s: SubmissionStat) => s.score !== null).length
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

    type AssignmentSub = { score: number | null; gradedAt: Date | null };
    type AssignmentWithSubs = {
      id: string;
      title: string;
      lesson: { title: string };
      dueDate: Date | null;
      maxScore: number;
      submissionType: string;
      _count: { submissions: number };
      submissions: AssignmentSub[];
    };
    const result = assignments.map((a: AssignmentWithSubs) => ({
      id: a.id,
      title: a.title,
      lessonTitle: a.lesson.title,
      dueDate: a.dueDate,
      maxScore: a.maxScore,
      submissionType: a.submissionType,
      totalSubmissions: a._count.submissions,
      gradedCount: a.submissions.filter((s: AssignmentSub) => s.gradedAt !== null).length,
      ungradedCount: a.submissions.filter((s: AssignmentSub) => s.gradedAt === null).length,
      averageScore:
        a.submissions.filter((s: AssignmentSub) => s.score !== null).length > 0
          ? Math.round(
              a.submissions.filter((s: AssignmentSub) => s.score !== null).reduce((sum: number, s: AssignmentSub) => sum + (s.score || 0), 0) /
                a.submissions.filter((s: AssignmentSub) => s.score !== null).length
            )
          : null,
    }));

    res.json(ApiResponse.success({ assignments: result, courseTitle: course.title }));
  } catch (error) {
    console.error('GetCourseAssignments error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte detyrat'));
  }
};

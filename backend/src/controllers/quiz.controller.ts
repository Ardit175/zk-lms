import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import { SubmitQuizInput } from '../validators/quiz.validator';
import { CreateQuizInput } from '../validators/quiz-create.validator';

export const getQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const quizId = req.params.id as string;
    const studentId = req.user!.id;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  select: { id: true, title: true },
                },
              },
            },
          },
        },
        _count: { select: { questions: true } },
      },
    });

    if (!quiz) {
      res.status(404).json(ApiResponse.error('Kuizi nuk u gjet'));
      return;
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: quiz.lesson.module.course.id,
        },
      },
    });

    if (!enrollment) {
      res.status(403).json(ApiResponse.error('Nuk je i regjistruar ne kete kurs'));
      return;
    }

    const attemptCount = await prisma.quizAttempt.count({
      where: { quizId, studentId },
    });

    res.json(ApiResponse.success({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
      questionCount: quiz._count.questions,
      attemptsUsed: attemptCount,
      attemptsRemaining: quiz.maxAttempts - attemptCount,
    }));
  } catch (error) {
    console.error('GetQuiz error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte kuizin'));
  }
};

export const startAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const quizId = req.params.id as string;
    const studentId = req.user!.id;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
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
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: {
              select: {
                id: true,
                optionText: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      res.status(404).json(ApiResponse.error('Kuizi nuk u gjet'));
      return;
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: quiz.lesson.module.course.id,
        },
      },
    });

    if (!enrollment) {
      res.status(403).json(ApiResponse.error('Nuk je i regjistruar ne kete kurs'));
      return;
    }

    const attemptCount = await prisma.quizAttempt.count({
      where: { quizId, studentId },
    });

    if (attemptCount >= quiz.maxAttempts) {
      res.status(400).json(ApiResponse.error('Ke arritur numrin maksimal te tentativave'));
      return;
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId,
        attemptNumber: attemptCount + 1,
      },
    });

    type QuizOptionRow = { id: string; optionText: string };
    type QuizQuestionRow = {
      id: string;
      questionText: string;
      type: string;
      points: number;
      options: QuizOptionRow[];
    };
    const questions = quiz.questions.map((q: QuizQuestionRow) => ({
      id: q.id,
      questionText: q.questionText,
      type: q.type,
      points: q.points,
      options: q.options,
    }));

    res.status(201).json(ApiResponse.success({
      attemptId: attempt.id,
      timeLimit: quiz.timeLimit,
      questions,
    }));
  } catch (error) {
    console.error('StartAttempt error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te fillonte tentativem'));
  }
};

export const submitAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const attemptId = req.params.attemptId as string;
    const { answers } = req.body as SubmitQuizInput;
    const studentId = req.user!.id;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
            lesson: true,
          },
        },
      },
    });

    if (!attempt) {
      res.status(404).json(ApiResponse.error('Tentativa nuk u gjet'));
      return;
    }

    if (attempt.studentId !== studentId) {
      res.status(403).json(ApiResponse.error('Kjo nuk eshte tentativa jote'));
      return;
    }

    if (attempt.completedAt) {
      res.status(400).json(ApiResponse.error('Kjo tentative eshte perfunduar tashme'));
      return;
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    const results: Array<{
      questionId: string;
      questionText: string;
      type: string;
      studentAnswer: string | null;
      correctAnswer: string | null;
      isCorrect: boolean;
      pointsEarned: number;
      maxPoints: number;
      explanation: string | null;
    }> = [];

    for (const question of attempt.quiz.questions) {
      totalPoints += question.points;
      const answer = answers.find((a: { questionId: string; selectedOptionId?: string; textAnswer?: string }) => a.questionId === question.id);

      let isCorrect = false;
      let pointsEarned = 0;
      let studentAnswer: string | null = null;
      let correctAnswer: string | null = null;

      if (question.type === 'SHORT_ANSWER') {
        studentAnswer = answer?.textAnswer || null;
        correctAnswer = question.options[0]?.optionText || null;
        isCorrect = false;
      } else {
        const selectedOption = question.options.find(
          (o: { id: string; isCorrect: boolean; optionText: string }) => o.id === answer?.selectedOptionId
        );
        const correctOption = question.options.find((o: { id: string; isCorrect: boolean; optionText: string }) => o.isCorrect);

        studentAnswer = selectedOption?.optionText || null;
        correctAnswer = correctOption?.optionText || null;
        isCorrect = selectedOption?.isCorrect || false;
      }

      if (isCorrect) {
        pointsEarned = question.points;
        earnedPoints += pointsEarned;
      }

      await prisma.quizAnswer.create({
        data: {
          attemptId,
          questionId: question.id,
          selectedOptionId: answer?.selectedOptionId,
          textAnswer: answer?.textAnswer,
          isCorrect,
          pointsEarned,
        },
      });

      results.push({
        questionId: question.id,
        questionText: question.questionText,
        type: question.type,
        studentAnswer,
        correctAnswer,
        isCorrect,
        pointsEarned,
        maxPoints: question.points,
        explanation: question.explanation,
      });
    }

    const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const isPassed = scorePercent >= attempt.quiz.passingScore;

    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score: scorePercent,
        isPassed,
        completedAt: new Date(),
      },
    });

    res.json(ApiResponse.success({
      score: scorePercent,
      earnedPoints,
      totalPoints,
      isPassed,
      passingScore: attempt.quiz.passingScore,
      results,
    }));
  } catch (error) {
    console.error('SubmitAttempt error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te dergonte pergjigjet'));
  }
};

export const getMyAttempts = async (req: Request, res: Response): Promise<void> => {
  try {
    const quizId = req.params.id as string;
    const studentId = req.user!.id;

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId, studentId },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        attemptNumber: true,
        score: true,
        isPassed: true,
        startedAt: true,
        completedAt: true,
      },
    });

    res.json(ApiResponse.success(attempts));
  } catch (error) {
    console.error('GetMyAttempts error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte tentativat'));
  }
};

// ─── INSTRUCTOR ENDPOINTS ────────────────────────────────────────────────────

export const createQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const instructorId = req.user!.id;
    const data = req.body as CreateQuizInput;

    const lesson = await prisma.lesson.findUnique({
      where: { id: data.lessonId },
      include: {
        module: {
          include: {
            course: { select: { id: true, instructorId: true } },
          },
        },
        quiz: { select: { id: true } },
      },
    });

    if (!lesson) {
      res.status(404).json(ApiResponse.error('Mesimi nuk u gjet'));
      return;
    }

    if (lesson.module.course.instructorId !== instructorId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses ne kete kurs'));
      return;
    }

    if (lesson.quiz) {
      res.status(400).json(ApiResponse.error('Ky mesim ka tashme nje kuiz'));
      return;
    }

    const quiz = await prisma.quiz.create({
      data: {
        lessonId: data.lessonId,
        title: data.title,
        description: data.description,
        timeLimit: data.timeLimit,
        passingScore: data.passingScore,
        maxAttempts: data.maxAttempts,
        isAiGenerated: data.isAiGenerated,
        questions: {
          create: data.questions.map((q: CreateQuizInput['questions'][number], index: number) => ({
            questionText: q.questionText,
            type: q.type,
            orderIndex: q.orderIndex ?? index,
            points: q.points,
            explanation: q.explanation,
            options: {
              create: q.options.map((opt: { optionText: string; isCorrect: boolean }) => ({
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: { options: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    res.status(201).json(ApiResponse.success(quiz));
  } catch (error) {
    console.error('CreateQuiz error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te krijonte kuizin'));
  }
};

export const getQuizForEdit = async (req: Request, res: Response): Promise<void> => {
  try {
    const lessonId = req.params.lessonId as string;
    const instructorId = req.user!.id;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: { select: { instructorId: true } },
          },
        },
        quiz: {
          include: {
            questions: {
              include: { options: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!lesson) {
      res.status(404).json(ApiResponse.error('Mesimi nuk u gjet'));
      return;
    }

    if (lesson.module.course.instructorId !== instructorId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses ne kete kurs'));
      return;
    }

    res.json(ApiResponse.success(lesson.quiz));
  } catch (error) {
    console.error('GetQuizForEdit error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te merrte kuizin'));
  }
};

export const deleteQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const quizId = req.params.id as string;
    const instructorId = req.user!.id;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
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

    if (!quiz) {
      res.status(404).json(ApiResponse.error('Kuizi nuk u gjet'));
      return;
    }

    if (quiz.lesson.module.course.instructorId !== instructorId) {
      res.status(403).json(ApiResponse.error('Nuk keni akses ne kete kuiz'));
      return;
    }

    await prisma.quiz.delete({ where: { id: quizId } });

    res.json(ApiResponse.success({ message: 'Kuizi u fshi me sukses' }));
  } catch (error) {
    console.error('DeleteQuiz error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te fshinte kuizin'));
  }
};

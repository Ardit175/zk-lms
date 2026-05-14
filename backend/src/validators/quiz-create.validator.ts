import { z } from 'zod';

export const createQuizSchema = z.object({
  body: z.object({
    lessonId: z.string().cuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    timeLimit: z.number().int().positive().optional(),
    passingScore: z.number().int().min(0).max(100).default(70),
    maxAttempts: z.number().int().min(1).max(10).default(3),
    isAiGenerated: z.boolean().default(false),
    questions: z.array(
      z.object({
        questionText: z.string().min(1),
        type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER']),
        orderIndex: z.number().int().min(0),
        points: z.number().int().min(1).default(1),
        explanation: z.string().optional(),
        options: z.array(
          z.object({
            optionText: z.string().min(1),
            isCorrect: z.boolean(),
          })
        ),
      })
    ).min(1),
  }),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>['body'];

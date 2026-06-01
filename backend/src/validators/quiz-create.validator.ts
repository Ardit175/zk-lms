import { z } from 'zod';

export const createQuizSchema = z.object({
  body: z.object({
    lessonId: z.string().cuid(),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(1000).optional(),
    timeLimit: z.number().int().positive().max(86400).optional(),
    passingScore: z.number().int().min(0).max(100).default(70),
    maxAttempts: z.number().int().min(1).max(10).default(3),
    isAiGenerated: z.boolean().default(false),
    questions: z.array(
      z.object({
        questionText: z.string().trim().min(1).max(1000),
        type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER']),
        orderIndex: z.number().int().min(0),
        points: z.number().int().min(1).max(100).default(1),
        explanation: z.string().trim().max(2000).optional(),
        options: z.array(
          z.object({
            optionText: z.string().trim().min(1).max(500),
            isCorrect: z.boolean(),
          })
        ),
      })
    ).min(1),
  }),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>['body'];

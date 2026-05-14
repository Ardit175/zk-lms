import { z } from 'zod';

export const createLiveSessionSchema = z.object({
  body: z.object({
    courseId: z.string().cuid(),
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    scheduledAt: z.string().datetime(),
  }),
});

export type CreateLiveSessionInput = z.infer<typeof createLiveSessionSchema>['body'];

export const askQuestionSchema = z.object({
  body: z.object({
    questionText: z.string().min(1).max(500),
  }),
});

export type AskQuestionInput = z.infer<typeof askQuestionSchema>['body'];

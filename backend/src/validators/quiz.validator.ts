import { z } from 'zod';

export const submitQuizSchema = z.object({
  params: z.object({
    attemptId: z.string().cuid(),
  }),
  body: z.object({
    answers: z.array(
      z.object({
        questionId: z.string().cuid(),
        selectedOptionId: z.string().cuid().optional(),
        textAnswer: z.string().optional(),
      })
    ),
  }),
});

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>['body'];

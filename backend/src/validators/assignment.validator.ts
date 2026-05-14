import { z } from 'zod';

export const submitAssignmentSchema = z.object({
  body: z.object({
    content: z.string().optional(),
    fileUrl: z.string().url().optional(),
    linkUrl: z.string().url().optional(),
  }).refine(
    (data) => data.content || data.fileUrl || data.linkUrl,
    { message: 'Duhet te jepni permbajtje, skedar, ose link' }
  ),
});

export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>['body'];

export const gradeSubmissionSchema = z.object({
  body: z.object({
    score: z.number().int().min(0),
    feedback: z.string().optional(),
  }),
});

export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>['body'];

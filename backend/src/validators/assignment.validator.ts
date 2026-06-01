import { z } from 'zod';

const httpUrl = z
  .string()
  .url()
  .refine((u) => /^https?:\/\//i.test(u), {
    message: 'Linku duhet te filloje me http:// ose https://',
  });

export const submitAssignmentSchema = z.object({
  body: z.object({
    content: z.string().max(50000, 'Permbajtja eshte shume e gjate').optional(),
    fileUrl: httpUrl.optional(),
    linkUrl: httpUrl.optional(),
  }).refine(
    (data) => data.content || data.fileUrl || data.linkUrl,
    { message: 'Duhet te jepni permbajtje, skedar, ose link' }
  ),
});

export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>['body'];

export const gradeSubmissionSchema = z.object({
  body: z.object({
    score: z.number().int().min(0),
    feedback: z.string().max(5000, 'Feedback eshte shume i gjate').optional(),
  }),
});

export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>['body'];

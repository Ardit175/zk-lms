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

// ─── Instructor: create / update an assignment on a lesson ────────────────────

export const createAssignmentSchema = z.object({
  body: z.object({
    lessonId: z.string().cuid(),
    title: z.string().trim().min(3, 'Titulli duhet te kete te pakten 3 karaktere').max(200),
    description: z.string().trim().min(1, 'Pershkrimi eshte i detyrueshem').max(2000),
    instructions: z.string().trim().min(1, 'Udhezimet jane te detyrueshme').max(10000),
    dueDate: z.string().datetime().nullable().optional(),
    maxScore: z.number().int().min(1).max(1000).default(100),
    submissionType: z.enum(['TEXT', 'FILE', 'LINK']).default('TEXT'),
  }),
});

export const updateAssignmentSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    instructions: z.string().trim().min(1).max(10000).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    maxScore: z.number().int().min(1).max(1000).optional(),
    submissionType: z.enum(['TEXT', 'FILE', 'LINK']).optional(),
  }),
  params: z.object({ id: z.string() }),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>['body'];
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>['body'];

import { z } from 'zod';

export const enrollInCourseSchema = z.object({
  body: z.object({
    courseId: z.string().cuid('ID e kursit duhet te jete nje CUID valid'),
  }),
});

export const markLessonCompleteSchema = z.object({
  params: z.object({
    courseId: z.string().cuid(),
    lessonId: z.string().cuid(),
  }),
  body: z.object({
    watchedSeconds: z.number().int().min(0).optional(),
  }),
});

export type EnrollInCourseInput = z.infer<typeof enrollInCourseSchema>['body'];
export type MarkLessonCompleteInput = z.infer<typeof markLessonCompleteSchema>;

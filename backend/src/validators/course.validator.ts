import { z } from 'zod';

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().trim().min(5, 'Title must be at least 5 characters').max(150, 'Title cannot exceed 150 characters'),
    description: z.string().trim().min(20, 'Description must be at least 20 characters').max(5000, 'Description cannot exceed 5000 characters'),
    categoryId: z.string().optional(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
    price: z.number().min(0).max(100000).default(0),
  }),
});

export const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().trim().min(5).max(150).optional(),
    description: z.string().trim().min(20).max(5000).optional(),
    categoryId: z.string().nullable().optional(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    price: z.number().min(0).max(100000).optional(),
    thumbnailUrl: z.string().url().nullable().optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

export const updateCourseStatusSchema = z.object({
  body: z.object({
    status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED']),
  }),
  params: z.object({
    id: z.string(),
  }),
});

export const createModuleSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150, 'Title cannot exceed 150 characters'),
    description: z.string().trim().max(1000).optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

export const updateModuleSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(150).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    isPublished: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string(),
    moduleId: z.string(),
  }),
});

export const reorderModulesSchema = z.object({
  body: z.object({
    modules: z.array(z.object({
      id: z.string(),
      orderIndex: z.number().int().min(0),
    })),
  }),
  params: z.object({
    id: z.string(),
  }),
});

export const createLessonSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200, 'Title cannot exceed 200 characters'),
    content: z.string().max(100000).optional(),
    videoUrl: z.string().optional(),
    videoType: z.enum(['YOUTUBE', 'VIMEO', 'UPLOAD']).optional(),
    pdfUrl: z.string().optional(),
    duration: z.number().int().min(0).optional(),
    type: z.enum(['VIDEO', 'TEXT', 'QUIZ', 'ASSIGNMENT']).default('TEXT'),
    isPreview: z.boolean().default(false),
  }),
  params: z.object({
    id: z.string(),
    moduleId: z.string(),
  }),
});

export const updateLessonSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(200).optional(),
    content: z.string().max(100000).nullable().optional(),
    videoUrl: z.string().nullable().optional(),
    videoType: z.enum(['YOUTUBE', 'VIMEO', 'UPLOAD']).nullable().optional(),
    pdfUrl: z.string().nullable().optional(),
    duration: z.number().int().min(0).nullable().optional(),
    type: z.enum(['VIDEO', 'TEXT', 'QUIZ', 'ASSIGNMENT']).optional(),
    isPreview: z.boolean().optional(),
    isPublished: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string(),
    moduleId: z.string(),
    lessonId: z.string(),
  }),
});

export const reorderLessonsSchema = z.object({
  body: z.object({
    lessons: z.array(z.object({
      id: z.string(),
      orderIndex: z.number().int().min(0),
    })),
  }),
  params: z.object({
    id: z.string(),
    moduleId: z.string(),
  }),
});

export const courseQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    search: z.string().optional(),
    page: z.string().optional().default('1').transform(Number),
    limit: z.string().optional().default('20').transform(Number),
  }),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>['body'];
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>['body'];
export type CreateModuleInput = z.infer<typeof createModuleSchema>['body'];
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>['body'];
export type CreateLessonInput = z.infer<typeof createLessonSchema>['body'];
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>['body'];

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email i pavlefshem'),
  password: z.string().min(1, 'Fjalekalimi eshte i detyrueshem'),
});

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Emri duhet te jete te pakten 2 karaktere'),
  lastName: z.string().min(2, 'Mbiemri duhet te jete te pakten 2 karaktere'),
  email: z.string().email('Email i pavlefshem'),
  password: z
    .string()
    .min(8, 'Fjalekalimi duhet te jete te pakten 8 karaktere')
    .regex(/[A-Z]/, 'Fjalekalimi duhet te kete te pakten nje shkronje te madhe')
    .regex(/[a-z]/, 'Fjalekalimi duhet te kete te pakten nje shkronje te vogel')
    .regex(/[0-9]/, 'Fjalekalimi duhet te kete te pakten nje numer'),
  confirmPassword: z.string(),
  role: z.enum(['INSTRUCTOR', 'STUDENT']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Fjalekalimi nuk perputhet',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type LessonType = 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT';
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  thumbnailUrl?: string;
  level: CourseLevel;
  status: CourseStatus;
  price: number;
  totalDuration: number;
  enrollmentCount: number;
  completionRate: number;
  averageRating: number;
  instructorId: string;
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
  instructor?: User;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  isPublished: boolean;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  orderIndex: number;
  type: LessonType;
  isPreview: boolean;
  isPublished: boolean;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
  progressPercent: number;
  enrolledAt: string;
  completedAt?: string;
  course?: Course;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type LessonType = 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT';
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
export type SubmissionType = 'TEXT' | 'FILE' | 'LINK';
export type LiveSessionStatus = 'SCHEDULED' | 'LIVE' | 'ENDED';
export type NotificationType =
  | 'COURSE_APPROVED'
  | 'COURSE_REJECTED'
  | 'ASSIGNMENT_DUE'
  | 'ASSIGNMENT_GRADED'
  | 'QUIZ_GRADED'
  | 'LIVE_STARTING'
  | 'CERTIFICATE_READY'
  | 'ENROLLMENT_NEW'
  | 'SYSTEM_MESSAGE';

export interface UserBase {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseBase {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleBase {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonBase {
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
  createdAt: Date;
  updatedAt: Date;
}

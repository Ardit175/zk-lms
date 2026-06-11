'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Clock,
  BookOpen,
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardList,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { adminApi, type CourseForReview } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

const LEVEL_LABELS = {
  BEGINNER: 'Fillestar',
  INTERMEDIATE: 'Mesatar',
  ADVANCED: 'Avancuar',
};

const LESSON_TYPE_ICONS = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
};

export default function CourseReviewPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<CourseForReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const res = await adminApi.getCourseForReview(courseId);
      if (res.data) {
        setCourse(res.data);
      }
    } catch (error) {
      console.error('Failed to load course:', error);
      router.push('/admin/courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Jeni te sigurt qe deshironi te aprovoni kete kurs?')) return;

    setIsSubmitting(true);
    try {
      await adminApi.reviewCourse(courseId, { action: 'approve' });
      router.push('/admin/courses');
    } catch (error) {
      console.error('Failed to approve course:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      alert('Ju lutem jepni feedback per instruktorin');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.reviewCourse(courseId, { action: 'reject', feedback });
      setShowRejectDialog(false);
      router.push('/admin/courses');
    } catch (error) {
      console.error('Failed to reject course:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Kursi nuk u gjet</p>
          <Button className="mt-4" onClick={() => router.push('/admin/courses')}>
            Kthehu te Kurset
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalDuration = course.modules
    .flatMap((m) => m.lessons)
    .reduce((sum, l) => sum + (l.duration || 0), 0);

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/courses')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
              <Badge variant={course.status === 'PENDING_REVIEW' ? 'warning' : 'default'}>
                {course.status === 'PENDING_REVIEW' ? 'Ne Pritje' : course.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">Rishikimi i kursit</p>
          </div>
          {course.status === 'PENDING_REVIEW' && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowRejectDialog(true)} disabled={isSubmitting}>
                <X className="h-4 w-4 mr-2" />
                Kerko Ndryshime
              </Button>
              <Button onClick={handleApprove} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Aprovo
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informacione te Kursit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.thumbnailUrl && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <Image
                      src={course.thumbnailUrl}
                      alt={course.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Pershkrimi</h3>
                  <p className="text-foreground">{course.description}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Niveli</p>
                    <p className="font-medium text-foreground">{LEVEL_LABELS[course.level]}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Kategoria</p>
                    <p className="font-medium text-foreground">
                      {course.category?.name || 'Pa kategori'}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Module</p>
                    <p className="font-medium text-foreground">{course.modules.length}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Mesime</p>
                    <p className="font-medium text-foreground">{totalLessons}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modules & Lessons */}
            <Card>
              <CardHeader>
                <CardTitle>Permbajtja e Kursit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.modules.map((module, moduleIndex) => (
                    <div key={module.id} className="border border-border rounded-lg">
                      <div className="p-4 bg-muted/50 border-b border-border">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Moduli {moduleIndex + 1}
                          </span>
                          <h3 className="font-semibold text-foreground">{module.title}</h3>
                          <span className="text-sm text-muted-foreground ml-auto">
                            {module.lessons.length} mesime
                          </span>
                        </div>
                      </div>
                      <div className="divide-y divide-border">
                        {module.lessons.map((lesson, lessonIndex) => {
                          const Icon = LESSON_TYPE_ICONS[lesson.type as keyof typeof LESSON_TYPE_ICONS] || FileText;
                          return (
                            <div
                              key={lesson.id}
                              className="p-3 flex items-center gap-3 hover:bg-muted/50"
                            >
                              <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm text-foreground flex-1">
                                {lessonIndex + 1}. {lesson.title}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {lesson.type}
                              </span>
                              {lesson.duration && (
                                <span className="text-xs text-muted-foreground">
                                  {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                                </span>
                              )}
                              {lesson.isPublished ? (
                                <Badge variant="success" className="text-xs">Gati</Badge>
                              ) : (
                                <Badge variant="draft" className="text-xs">Draft</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructor Card */}
            <Card>
              <CardHeader>
                <CardTitle>Instruktori</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  {course.instructor.avatarUrl ? (
                    <Image
                      src={course.instructor.avatarUrl}
                      alt={`${course.instructor.firstName} ${course.instructor.lastName}`}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground">
                      {course.instructor.firstName} {course.instructor.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {course.instructor.email}
                    </p>
                  </div>
                </div>
                {course.instructor.instructorProfile?.bio && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {course.instructor.instructorProfile.bio}
                  </p>
                )}
                {course.instructor.instructorProfile?.expertise && course.instructor.instructorProfile.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {course.instructor.instructorProfile.expertise.map((exp, i) => (
                      <Badge key={i} variant="secondary">{exp}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistika</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Module
                  </span>
                  <span className="font-medium">{course.modules.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Mesime
                  </span>
                  <span className="font-medium">{totalLessons}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Kohezgjatja Totale
                  </span>
                  <span className="font-medium">
                    {Math.floor(totalDuration / 60)} min
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kerko Ndryshime</DialogTitle>
            <DialogDescription>
              Shkruani feedback per instruktorin per cfare duhet te ndryshoje.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Pershkruani ndryshimet e nevojshme..."
              className="w-full h-32 p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Anulo
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Dergo Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

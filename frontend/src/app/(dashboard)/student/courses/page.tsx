'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  PlayCircle,
  CheckCircle,
  Award,
  Search,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CourseCard } from '@/components/course/CourseCard';
import { CardGridSkeleton } from '@/components/ui/skeletons';
import { enrollmentsApi, type Enrollment } from '@/lib/api/enrollments';

const STATUS_CONFIG = {
  ACTIVE: { label: 'Aktiv', variant: 'default' as const },
  COMPLETED: { label: 'Perfunduar', variant: 'success' as const },
  DROPPED: { label: 'Braktisur', variant: 'destructive' as const },
};

export default function StudentCoursesPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      const res = await enrollmentsApi.getMyEnrollments();
      if (res.data) {
        setEnrollments(res.data);
      }
    } catch (error) {
      console.error('Failed to load enrollments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueCourse = async (enrollment: Enrollment) => {
    try {
      const res = await enrollmentsApi.getCourseProgress(enrollment.courseId);
      if (res.data) {
        const firstIncompleteLesson = res.data.modules
          .flatMap((m) => m.lessons)
          .find((l) => !l.isCompleted);

        const lessonId = firstIncompleteLesson?.id || res.data.modules[0]?.lessons[0]?.id;
        if (lessonId) {
          router.push(`/student/courses/${enrollment.courseId}/learn/${lessonId}`);
        }
      }
    } catch (error) {
      console.error('Failed to get course progress:', error);
    }
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (searchQuery && !enrollment.course.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'ALL' && enrollment.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const activeCount = enrollments.filter((e) => e.status === 'ACTIVE').length;
  const completedCount = enrollments.filter((e) => e.status === 'COMPLETED').length;

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kurset e Mia</h1>
          <p className="text-slate-500 mt-1">
            Vazhdo mesimin ose rishiko kurset e perfunduara
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <PlayCircle className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
                <p className="text-sm text-slate-500">Kurse Aktive</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
                <p className="text-sm text-slate-500">Kurse te Perfunduara</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
                <p className="text-sm text-slate-500">Certifikata</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Kerko kurse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'ALL' ? 'Te gjitha' : STATUS_CONFIG[status].label}
              </Button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <CardGridSkeleton count={6} />
        ) : filteredEnrollments.length === 0 ? (
          <EmptyState hasFilters={searchQuery !== '' || statusFilter !== 'ALL'} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEnrollments.map((enrollment) => (
              <CourseCard
                key={enrollment.id}
                title={enrollment.course.title}
                thumbnailUrl={enrollment.course.thumbnailUrl}
                level={enrollment.course.level}
                instructor={enrollment.course.instructor}
                duration={enrollment.course.totalDuration}
                progress={enrollment.progressPercent}
                badge={
                  <Badge variant={STATUS_CONFIG[enrollment.status].variant}>
                    {STATUS_CONFIG[enrollment.status].label}
                  </Badge>
                }
                footer={
                  enrollment.status === 'COMPLETED' ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleContinueCourse(enrollment)}
                      >
                        Rishiko
                      </Button>
                      {enrollment.certificate && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => router.push('/student/certificates')}
                        >
                          <Award className="h-4 w-4 mr-2" />
                          Certifikata
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button className="w-full" onClick={() => handleContinueCourse(enrollment)}>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Vazhdo Mesimin
                    </Button>
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

interface EmptyStateProps {
  hasFilters: boolean;
}

function EmptyState({ hasFilters }: EmptyStateProps) {
  const router = useRouter();

  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <BookOpen className="h-12 w-12 text-slate-400" />
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-lg font-semibold text-slate-900">
            Asnje kurs i gjetur
          </h3>
          <p className="text-slate-500 mt-1">
            Provo te ndryshosh filtrat e kerkimit.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-slate-900">
            Nuk ke kurse te regjistruara
          </h3>
          <p className="text-slate-500 mt-1">
            Eksploro kurset tona dhe fillo te mesosh sot.
          </p>
          <Button className="mt-4" onClick={() => router.push('/courses')}>
            Eksploro Kurset
          </Button>
        </>
      )}
    </div>
  );
}

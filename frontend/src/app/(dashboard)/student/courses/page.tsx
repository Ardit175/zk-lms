'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Clock,
  PlayCircle,
  CheckCircle,
  Award,
  Loader2,
  Search,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { enrollmentsApi, type Enrollment } from '@/lib/api/enrollments';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  ACTIVE: { label: 'Aktiv', variant: 'default' as const, color: 'bg-indigo-500' },
  COMPLETED: { label: 'Perfunduar', variant: 'success' as const, color: 'bg-green-500' },
  DROPPED: { label: 'Braktisur', variant: 'destructive' as const, color: 'bg-red-500' },
};

const LEVEL_LABELS = {
  BEGINNER: 'Fillestar',
  INTERMEDIATE: 'Mesatar',
  ADVANCED: 'Avancuar',
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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <EmptyState hasFilters={searchQuery !== '' || statusFilter !== 'ALL'} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEnrollments.map((enrollment) => (
              <EnrollmentCard
                key={enrollment.id}
                enrollment={enrollment}
                onContinue={() => handleContinueCourse(enrollment)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

interface EnrollmentCardProps {
  enrollment: Enrollment;
  onContinue: () => void;
}

function EnrollmentCard({ enrollment, onContinue }: EnrollmentCardProps) {
  const status = STATUS_CONFIG[enrollment.status];
  const course = enrollment.course;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-slate-100 relative">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-slate-300" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        {enrollment.certificate && (
          <div className="absolute top-2 left-2">
            <Badge variant="warning" className="bg-amber-500">
              <Award className="h-3 w-3 mr-1" />
              Certifikuar
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-slate-900 truncate mb-1">
          {course.title}
        </h3>
        <p className="text-sm text-slate-500 mb-3">
          {course.instructor.firstName} {course.instructor.lastName}
        </p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Progresi</span>
            <span className="font-medium text-slate-900">
              {enrollment.progressPercent}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all', status.color)}
              style={{ width: `${enrollment.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{course.totalDuration} min</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs">
            {LEVEL_LABELS[course.level]}
          </span>
        </div>

        {/* Action Button */}
        {enrollment.status === 'ACTIVE' ? (
          <Button className="w-full" onClick={onContinue}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Vazhdo Mesimin
          </Button>
        ) : enrollment.status === 'COMPLETED' ? (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onContinue}>
              Rishiko
            </Button>
            {enrollment.certificate && (
              <Button variant="outline" className="flex-1">
                <Award className="h-4 w-4 mr-2" />
                Certifikata
              </Button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
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

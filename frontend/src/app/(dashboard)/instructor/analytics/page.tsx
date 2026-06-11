'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Users, BookOpen, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { coursesApi, type Course } from '@/lib/api/courses';

const STATUS_CONFIG: Record<Course['status'], { label: string; variant: 'draft' | 'warning' | 'success' | 'destructive' }> = {
  DRAFT: { label: 'Draft', variant: 'draft' },
  PENDING_REVIEW: { label: 'Ne Pritje', variant: 'warning' },
  PUBLISHED: { label: 'Publikuar', variant: 'success' },
  ARCHIVED: { label: 'Arkivuar', variant: 'destructive' },
};

export default function InstructorAnalyticsPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const res = await coursesApi.getInstructorCourses();
      setCourses(res.data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout role="INSTRUCTOR">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analitika</h1>
          <p className="text-muted-foreground mt-1">Zgjidh nje kurs per te pare statistika te detajuara</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h2 className="text-lg font-semibold text-foreground">Ngarkimi deshtoi</h2>
            <Button className="mt-4" onClick={loadCourses}>
              Provo Perseri
            </Button>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Asnje kurs ende</h3>
            <p className="text-muted-foreground mt-1">
              Krijo nje kurs per te pare analitiken e tij.
            </p>
            <Button className="mt-4" onClick={() => router.push('/instructor/courses')}>
              Shko te Kurset
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => router.push(`/instructor/courses/${course.id}/analytics`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-foreground line-clamp-2">{course.title}</h3>
                    <Badge variant={STATUS_CONFIG[course.status].variant}>
                      {STATUS_CONFIG[course.status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course._count?.enrollments ?? course.enrollmentCount ?? 0} studente
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {course._count?.modules ?? 0} module
                    </span>
                  </div>
                  <div className="flex items-center justify-end mt-4 text-sm font-medium text-primary">
                    Shiko Analitiken
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

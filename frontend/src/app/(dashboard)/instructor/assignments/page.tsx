'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Loader2, AlertCircle, ChevronRight, ClipboardList } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { coursesApi, type Course } from '@/lib/api/courses';
import { assignmentsApi } from '@/lib/api/assignments';

interface CourseAssignmentSummary {
  course: Course;
  assignmentCount: number;
  ungradedCount: number;
}

export default function InstructorAssignmentsPage() {
  const router = useRouter();
  const [summaries, setSummaries] = useState<CourseAssignmentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const coursesRes = await coursesApi.getInstructorCourses();
      const courses = coursesRes.data || [];

      const results = await Promise.all(
        courses.map((course) =>
          assignmentsApi
            .getCourseAssignments(course.id)
            .then((res) => {
              const assignments = res.data?.assignments || [];
              return {
                course,
                assignmentCount: assignments.length,
                ungradedCount: assignments.reduce((sum, a) => sum + a.ungradedCount, 0),
              };
            })
            .catch(() => ({ course, assignmentCount: 0, ungradedCount: 0 }))
        )
      );

      setSummaries(results);
    } catch (err) {
      console.error('Failed to load assignments:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const coursesWithAssignments = summaries.filter((s) => s.assignmentCount > 0);

  return (
    <DashboardLayout role="INSTRUCTOR">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Detyrat</h1>
          <p className="text-muted-foreground mt-1">
            Vleresoni dorezimet e studenteve sipas kursit
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h2 className="text-lg font-semibold text-foreground">Ngarkimi deshtoi</h2>
            <Button className="mt-4" onClick={loadData}>
              Provo Perseri
            </Button>
          </div>
        ) : coursesWithAssignments.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Asnje detyre ende</h3>
            <p className="text-muted-foreground mt-1">
              Shtoni mesime te tipit &quot;Detyre&quot; ne kurset tuaja per t&apos;i pare ketu.
            </p>
            <Button className="mt-4" onClick={() => router.push('/instructor/courses')}>
              Shko te Kurset
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {coursesWithAssignments.map(({ course, assignmentCount, ungradedCount }) => (
              <Card
                key={course.id}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => router.push(`/instructor/courses/${course.id}/assignments`)}
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-primary/15 rounded-lg flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{course.title}</p>
                      <p className="text-sm text-muted-foreground">{assignmentCount} detyra</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {ungradedCount > 0 ? (
                      <Badge variant="warning">{ungradedCount} pa vleresuar</Badge>
                    ) : (
                      <Badge variant="success">Te vleresuara</Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Star,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi, type AdminCourse } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', variant: 'draft' as const },
  PENDING_REVIEW: { label: 'Ne Pritje', variant: 'warning' as const },
  PUBLISHED: { label: 'Publikuar', variant: 'success' as const },
  ARCHIVED: { label: 'Arkivuar', variant: 'destructive' as const },
};

const LEVEL_LABELS = {
  BEGINNER: 'Fillestar',
  INTERMEDIATE: 'Mesatar',
  ADVANCED: 'Avancuar',
};

export default function AdminCoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadCourses();
  }, [pagination.page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((p) => ({ ...p, page: 1 }));
      loadCourses();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getCourses({
        search: searchQuery || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (res.data) {
        setCourses(res.data.courses);
        setPagination((p) => ({
          ...p,
          total: res.data!.pagination.total,
          totalPages: res.data!.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewCourse = (courseId: string) => {
    router.push(`/admin/courses/${courseId}/review`);
  };

  const statusTabs = [
    { value: 'ALL', label: 'Te gjitha' },
    { value: 'PENDING_REVIEW', label: 'Ne Pritje', highlight: true },
    { value: 'PUBLISHED', label: 'Publikuar' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'ARCHIVED', label: 'Arkivuar' },
  ];

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kurset</h1>
          <p className="text-muted-foreground mt-1">Menaxho dhe rishiko kurset e platformes</p>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 border-b border-border pb-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                statusFilter === tab.value
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-muted',
                tab.highlight && statusFilter !== tab.value && 'text-warning'
              )}
            >
              {tab.label}
              {tab.highlight && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-warning/15 text-warning rounded">
                  !
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kerko kurse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Courses Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                Nuk u gjeten kurse
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Kursi
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Instruktori
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Statusi
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Statistika
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Krijuar
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Veprime
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {courses.map((course) => {
                      const status = STATUS_CONFIG[course.status];
                      return (
                        <tr
                          key={course.id}
                          className="odd:bg-muted/50 transition-colors hover:bg-primary/10"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-foreground">{course.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {course.category?.name || 'Pa kategori'} •{' '}
                                {LEVEL_LABELS[course.level]}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {course.instructor.firstName} {course.instructor.lastName}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {course.enrollmentCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-amber-500" />
                                {course.averageRating?.toFixed(1) || '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(course.createdAt).toLocaleDateString('sq-AL')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {course.status === 'PENDING_REVIEW' ? (
                              <Button size="sm" onClick={() => handleReviewCourse(course.id)}>
                                Rishiko
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReviewCourse(course.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Shiko
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Duke shfaqur {(pagination.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} nga{' '}
              {pagination.total} kurse
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-foreground">
                Faqja {pagination.page} nga {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

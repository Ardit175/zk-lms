'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  BarChart3,
  ExternalLink,
  Archive,
  Users,
  Star,
  Clock,
  BookOpen,
  Loader2,
  FileText,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { coursesApi, categoriesApi, type Course, type Category } from '@/lib/api/courses';

const createCourseSchema = z.object({
  title: z.string().min(5, 'Titulli duhet te jete te pakten 5 karaktere'),
  description: z.string().min(20, 'Pershkrimi duhet te jete te pakten 20 karaktere'),
  categoryId: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
});

type CreateCourseInput = z.infer<typeof createCourseSchema>;

const STATUS_CONFIG: Record<Course['status'], { label: string; variant: 'draft' | 'warning' | 'success' | 'destructive' }> = {
  DRAFT: { label: 'Draft', variant: 'draft' },
  PENDING_REVIEW: { label: 'Ne Pritje', variant: 'warning' },
  PUBLISHED: { label: 'Publikuar', variant: 'success' },
  ARCHIVED: { label: 'Arkivuar', variant: 'destructive' },
};

const LEVEL_LABELS: Record<Course['level'], string> = {
  BEGINNER: 'Fillestar',
  INTERMEDIATE: 'Mesatar',
  ADVANCED: 'Avancuar',
};

export default function InstructorCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Course['status'] | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      level: 'BEGINNER',
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, categoriesRes] = await Promise.all([
        coursesApi.getInstructorCourses(),
        categoriesApi.getAll(),
      ]);
      if (coursesRes.data) setCourses(coursesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onCreateCourse = async (data: CreateCourseInput) => {
    setIsCreating(true);
    try {
      const res = await coursesApi.createCourse(data);
      if (res.data) {
        setIsDialogOpen(false);
        reset();
        router.push(`/instructor/courses/${res.data.id}/edit`);
      }
    } catch (error) {
      console.error('Failed to create course:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleArchive = async (courseId: string) => {
    if (!confirm('Jeni te sigurt qe deshironi te arkivoni kete kurs?')) return;
    try {
      await coursesApi.updateCourseStatus(courseId, 'ARCHIVED');
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, status: 'ARCHIVED' as const } : c))
      );
    } catch (error) {
      console.error('Failed to archive course:', error);
    }
  };

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'ALL' && course.status !== statusFilter) {
      return false;
    }
    if (categoryFilter !== 'ALL' && course.categoryId !== categoryFilter) {
      return false;
    }
    return true;
  });

  return (
    <DashboardLayout role="INSTRUCTOR">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kurset e Mia</h1>
            <p className="text-slate-500 mt-1">Menaxho dhe krijo kurse te reja</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Krijo Kurs te Ri
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit(onCreateCourse)}>
                <DialogHeader>
                  <DialogTitle>Krijo Kurs te Ri</DialogTitle>
                  <DialogDescription>
                    Ploteso informacionet baze per kursin tend te ri.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titulli</Label>
                    <Input
                      id="title"
                      placeholder="p.sh. Hyrje ne React"
                      {...register('title')}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500">{errors.title.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Pershkrimi</Label>
                    <textarea
                      id="description"
                      rows={3}
                      placeholder="Pershkruaj kursin tend..."
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      {...register('description')}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500">{errors.description.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Kategoria</Label>
                      <select
                        id="category"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        {...register('categoryId')}
                      >
                        <option value="">Zgjidh...</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level">Niveli</Label>
                      <select
                        id="level"
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        {...register('level')}
                      >
                        <option value="BEGINNER">Fillestar</option>
                        <option value="INTERMEDIATE">Mesatar</option>
                        <option value="ADVANCED">Avancuar</option>
                      </select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Anulo
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Duke krijuar...
                      </>
                    ) : (
                      'Krijo Kursin'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Course['status'] | 'ALL')}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Te gjithe statuset</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Ne Pritje</option>
            <option value="PUBLISHED">Publikuar</option>
            <option value="ARCHIVED">Arkivuar</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Te gjitha kategorite</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <EmptyState
            hasFilters={searchQuery !== '' || statusFilter !== 'ALL' || categoryFilter !== 'ALL'}
            onCreateClick={() => setIsDialogOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={() => router.push(`/instructor/courses/${course.id}/edit`)}
                onAnalytics={() => router.push(`/instructor/courses/${course.id}/analytics`)}
                onAssignments={() => router.push(`/instructor/courses/${course.id}/assignments`)}
                onViewAsStudent={() => window.open(`/courses/${course.slug}`, '_blank')}
                onArchive={() => handleArchive(course.id)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

interface CourseCardProps {
  course: Course;
  onEdit: () => void;
  onAnalytics: () => void;
  onAssignments: () => void;
  onViewAsStudent: () => void;
  onArchive: () => void;
}

function CourseCard({ course, onEdit, onAnalytics, onAssignments, onViewAsStudent, onArchive }: CourseCardProps) {
  const status = STATUS_CONFIG[course.status];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Thumbnail */}
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
      </div>

      <CardContent className="p-4">
        {/* Title & Category */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{course.title}</h3>
            {course.category && (
              <p className="text-sm text-slate-500">{course.category.name}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edito
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAnalytics}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analitika
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAssignments}>
                <FileText className="h-4 w-4 mr-2" />
                Detyrat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewAsStudent}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Shiko si Student
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onArchive} className="text-red-600">
                <Archive className="h-4 w-4 mr-2" />
                Arkivo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{course.enrollmentCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-500" />
            <span>{course.averageRating?.toFixed(1) || '-'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{course.totalDuration}min</span>
          </div>
        </div>

        {/* Level Badge */}
        <div className="mt-3">
          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
            {LEVEL_LABELS[course.level]}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  hasFilters: boolean;
  onCreateClick: () => void;
}

function EmptyState({ hasFilters, onCreateClick }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <BookOpen className="h-12 w-12 text-slate-400" />
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-lg font-semibold text-slate-900">Asnje kurs i gjetur</h3>
          <p className="text-slate-500 mt-1">Provo te ndrryshosh filtrat e kerkimit.</p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-slate-900">Krijo kursin tend te pare</h3>
          <p className="text-slate-500 mt-1">
            Fillo te ndertosh permbajtje dhe te ndash dijen me te tjeret.
          </p>
          <Button className="mt-4" onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Krijo Kurs te Ri
          </Button>
        </>
      )}
    </div>
  );
}

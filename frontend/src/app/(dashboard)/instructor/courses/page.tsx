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
  BookOpen,
  FileText,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CourseCard } from '@/components/course/CourseCard';
import { CardGridSkeleton } from '@/components/ui/skeletons';
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
            <h1 className="text-2xl font-bold text-foreground">Kurset e Mia</h1>
            <p className="text-muted-foreground mt-1">Menaxho dhe krijo kurse te reja</p>
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
                      className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                        className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                        className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
            className="rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
            className="rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
          <CardGridSkeleton count={6} />
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
                title={course.title}
                thumbnailUrl={course.thumbnailUrl}
                category={course.category?.name}
                level={course.level}
                enrollmentCount={course.enrollmentCount}
                rating={course.averageRating}
                duration={course.totalDuration}
                badge={
                  <Badge variant={STATUS_CONFIG[course.status].variant}>
                    {STATUS_CONFIG[course.status].label}
                  </Badge>
                }
                menu={
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-card/90 backdrop-blur-sm hover:bg-card"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/instructor/courses/${course.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edito
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/instructor/courses/${course.id}/analytics`)}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analitika
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/instructor/courses/${course.id}/assignments`)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Detyrat
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => window.open(`/courses/${course.slug}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Shiko si Student
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleArchive(course.id)}
                        className="text-destructive"
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Arkivo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
                onClick={() => router.push(`/instructor/courses/${course.id}/edit`)}
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
  onCreateClick: () => void;
}

function EmptyState({ hasFilters, onCreateClick }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-lg font-semibold text-foreground">Asnje kurs i gjetur</h3>
          <p className="text-muted-foreground mt-1">Provo te ndrryshosh filtrat e kerkimit.</p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-foreground">Krijo kursin tend te pare</h3>
          <p className="text-muted-foreground mt-1">
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

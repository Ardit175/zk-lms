'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Search,
  BookOpen,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CourseCard } from '@/components/course/CourseCard';
import { CardGridSkeleton } from '@/components/ui/skeletons';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface PublicCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  enrollmentCount: number;
  averageRating: number;
  instructor: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  category: { id: string; name: string; slug: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const LEVELS = [
  { value: 'ALL', label: 'Te gjitha nivelet' },
  { value: 'BEGINNER', label: 'Fillestar' },
  { value: 'INTERMEDIATE', label: 'Mesatar' },
  { value: 'ADVANCED', label: 'Avancuar' },
];

export default function PublicCoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categorySlug, setCategorySlug] = useState('ALL');
  const [level, setLevel] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Categories load once
  useEffect(() => {
    api.get('/api/categories').then((r) => setCategories(r.data?.data || [])).catch(() => {});
  }, []);

  // Debounce the search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [debouncedSearch, categorySlug, level]);

  // Fetch courses
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number> = {
          page: pagination.page,
          limit: pagination.limit,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (categorySlug !== 'ALL') params.category = categorySlug;
        if (level !== 'ALL') params.level = level;

        const res = await api.get('/api/courses', { params });
        const payload = res.data?.data;
        setCourses(payload?.courses || []);
        if (payload?.pagination) {
          setPagination((p) => ({ ...p, ...payload.pagination }));
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [debouncedSearch, categorySlug, level, pagination.page, pagination.limit]);

  const handleCourseClick = (course: PublicCourse) => {
    if (isAuthenticated && user?.role === 'INSTRUCTOR') {
      router.push('/instructor/courses');
    } else if (isAuthenticated && user?.role === 'ADMIN') {
      router.push(`/admin/courses/${course.id}/review`);
    } else {
      // STUDENT or guest — show public detail page where they can enroll
      router.push(`/courses/${course.slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header — matches the landing page header */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-200">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-slate-900">ZK-LMS</span>
          </Link>
          <nav className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href={
                  user?.role === 'ADMIN'
                    ? '/admin/dashboard'
                    : user?.role === 'INSTRUCTOR'
                      ? '/instructor/dashboard'
                      : '/student/dashboard'
                }
              >
                <Button>Paneli Kryesor</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Hyr</Button>
                </Link>
                <Link href="/register">
                  <Button>Fillo Tani</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-600 py-16">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl" />
          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold text-white sm:text-5xl">
                Eksploro Kurset
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100">
                Shfleto kurset tona te publikuara dhe gjej ate qe te pershtatet ty.
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b border-slate-100 bg-white py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Kerko kurse..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Te gjitha kategorite</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="bg-slate-50 py-12">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <CardGridSkeleton count={6} />
            ) : courses.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50">
                  <BookOpen className="h-12 w-12 text-indigo-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Asnje kurs nuk u gjet
                </h3>
                <p className="mt-1.5 max-w-sm text-sm text-slate-600">
                  Provo te ndryshosh filtrat e kerkimit ose te kerkosh me terma me te pergjithshem.
                </p>
              </div>
            ) : (
              <>
                <p className="mb-6 text-sm text-slate-600">
                  {pagination.total} kurse te gjetura
                </p>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      title={course.title}
                      thumbnailUrl={course.thumbnailUrl}
                      category={course.category?.name}
                      level={course.level}
                      instructor={course.instructor}
                      enrollmentCount={course.enrollmentCount}
                      rating={course.averageRating}
                      onClick={() => handleCourseClick(course)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 text-sm text-slate-600">
                      Faqja {pagination.page} nga {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* CTA for guests */}
        {!isAuthenticated && (
          <section className="bg-gradient-to-br from-indigo-600 to-purple-600 py-16">
            <div className="container mx-auto px-4">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold text-white">
                  Gati per te filluar?
                </h2>
                <p className="mt-3 text-indigo-100">
                  Krijo nje llogari falas dhe regjistrohu ne kursin tend te pare.
                </p>
                <div className="mt-6">
                  <Link href="/register">
                    <Button size="lg" className="bg-white text-indigo-700 shadow-lg hover:bg-indigo-50">
                      Krijo Llogari Falas
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-slate-400">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>
            &copy; 2026 ZK-LMS · Projekt Diplome · Universiteti i Tiranes
          </p>
        </div>
      </footer>
    </div>
  );
}

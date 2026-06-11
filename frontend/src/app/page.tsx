'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Video,
  ArrowRight,
  Brain,
  BarChart3,
  GraduationCap,
  Mail,
  Award,
  Users,
  Star,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CourseCard } from '@/components/course/CourseCard';
import { CountUp } from '@/components/ui/count-up';
import { Reveal } from '@/components/ui/reveal';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface PublicStats {
  courses: number;
  students: number;
  instructors: number;
}

interface FeaturedCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  enrollmentCount: number;
  averageRating: number;
  instructor: { firstName: string; lastName: string; avatarUrl: string | null };
  category: { name: string } | null;
}

const features = [
  {
    icon: Brain,
    title: 'Kuize me AI',
    description:
      'Gjenerimi automatik i kuizeve nga permbajtja e mesimeve me inteligjence artificiale.',
  },
  {
    icon: Video,
    title: 'Sesione Live',
    description:
      'Sesione ne kohe reale me Q&A dhe chat per nderveprim direkt me instruktorin.',
  },
  {
    icon: BarChart3,
    title: 'Gjurmo Progresin',
    description: 'Statistika te detajuara per progresin tend ne cdo kurs dhe modul.',
  },
  {
    icon: Award,
    title: 'Certifikata',
    description: 'Merr certifikata te verifikueshme publikisht per cdo kurs te perfunduar.',
  },
];

const steps = [
  { number: '01', title: 'Krijo Llogarine', description: 'Regjistrohu falas si student ose instruktor.' },
  { number: '02', title: 'Regjistrohu ne Kurse', description: 'Shfleto dhe zgjidh kurset qe te interesojne.' },
  { number: '03', title: 'Meso & Certifikohu', description: 'Perfundo kurset dhe merr certifikata te verifikueshme.' },
];

const testimonials = [
  {
    name: 'Elsa Hoxha',
    role: 'Studente, Inxhinieri Software',
    text: 'Kuizet e gjeneruara nga AI me ndihmuan te kuptoja konceptet me te veshtira. Platforma me e mire qe kam perdorur.',
  },
  {
    name: 'Andi Krasniqi',
    role: 'Instruktor, Web Development',
    text: 'Course Builder-i eshte intuitiv dhe sesionet live funksionojne pa probleme. E rekomandoj per cdo instruktor.',
  },
  {
    name: 'Marsida Berisha',
    role: 'Studente, Data Science',
    text: 'Gjurmimi i progresit dhe kalendari me mbajten te organizuar gjate gjithe semestrit. Certifikatat jane bonus i shkelqyer.',
  },
];

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [featuredCourses, setFeaturedCourses] = useState<FeaturedCourse[]>([]);

  const dashboardPath =
    user?.role === 'ADMIN'
      ? '/admin/dashboard'
      : user?.role === 'INSTRUCTOR'
        ? '/instructor/dashboard'
        : '/student/dashboard';

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, coursesRes] = await Promise.all([
          api.get('/api/courses/stats'),
          api.get('/api/courses/featured'),
        ]);
        if (statsRes.data?.data) setStats(statsRes.data.data);
        if (coursesRes.data?.data) setFeaturedCourses(coursesRes.data.data);
      } catch (error) {
        console.error('Failed to load landing data:', error);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-5 text-white shadow-sm shadow-primary/30">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-bold text-foreground">ZK-LMS</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/courses" className="hidden sm:block">
              <Button variant="ghost">Kurset</Button>
            </Link>
            <ThemeToggle />
            {isAuthenticated ? (
              <Link href={dashboardPath}>
                <Button>Paneli Kryesor</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
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
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 py-24 lg:py-36">
          {/* drifting mesh + grid */}
          <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-soft-light [background:radial-gradient(40rem_40rem_at_15%_20%,rgba(255,255,255,0.4),transparent_60%),radial-gradient(35rem_35rem_at_85%_10%,rgba(168,85,247,0.5),transparent_60%)] [background-size:200%_200%] motion-safe:animate-[mesh-drift_22s_ease-in-out_infinite_alternate]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:44px_44px]" />

          <div className="container relative mx-auto px-4">
            <motion.div
              className="mx-auto max-w-4xl text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="mb-6 inline-block rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                Platforma e te Mesuarit te Ardhmes
              </span>
              <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                Meso Pa Kufij me{' '}
                <span className="bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                  Fuqine e AI
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-indigo-100">
                Platforma moderne e menaxhimit te mesimit me bashkepunim ne kohe reale,
                kuize te gjeneruara nga AI, dhe gjurmim te plote te progresit.
              </p>
              <motion.div
                className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {isAuthenticated ? (
                  <>
                    <Link href={dashboardPath}>
                      <Button size="lg" className="bg-card text-primary shadow-lg hover:bg-primary/10">
                        Paneli Kryesor
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/courses">
                      <Button
                        size="lg"
                        className="border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                      >
                        Shfleto Kurset
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/register">
                      <Button size="lg" className="bg-card text-primary shadow-lg hover:bg-primary/10">
                        Fillo te Mesosh
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/register?role=instructor">
                      <Button
                        size="lg"
                        className="border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                      >
                        Behu Instruktor
                      </Button>
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats bar */}
        {stats && (
          <section className="border-b border-border bg-card py-10">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-3 gap-8">
                {[
                  { value: stats.courses, label: 'Kurse', icon: GraduationCap },
                  { value: stats.students, label: 'Studente', icon: Users },
                  { value: stats.instructors, label: 'Instruktore', icon: Brain },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center text-center">
                    <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-display text-3xl font-bold text-foreground">
                      <CountUp value={s.value} suffix="+" />
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold text-foreground lg:text-4xl">
                Funksionalitete te Fuqishme
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                E gjitha cfare nevojitet per nje eksperience mesimi efektive.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => (
                <Reveal key={feature.title} delay={i * 0.08}>
                  <Card className="group h-full border-gradient transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
                    <CardContent className="p-6">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Featured courses */}
        {featuredCourses.length > 0 && (
          <section className="bg-muted/40 py-24">
            <div className="container mx-auto px-4">
              <div className="mx-auto mb-14 max-w-2xl text-center">
                <h2 className="font-display text-3xl font-bold text-foreground lg:text-4xl">
                  Kurset me Popullarizuara
                </h2>
                <p className="mt-3 text-lg text-muted-foreground">
                  Fillo udhetimin tend me kurset tona me te mira.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredCourses.map((course, i) => (
                  <Reveal key={course.id} delay={i * 0.08}>
                    <CourseCard
                      href={`/courses/${course.slug}`}
                      title={course.title}
                      thumbnailUrl={course.thumbnailUrl}
                      category={course.category?.name}
                      level={course.level}
                      instructor={course.instructor}
                      enrollmentCount={course.enrollmentCount}
                      rating={course.averageRating}
                    />
                  </Reveal>
                ))}
              </div>
              <div className="mt-12 text-center">
                <Link href="/courses">
                  <Button variant="outline" size="lg">
                    Shiko te Gjitha Kurset
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold text-foreground lg:text-4xl">Si Funksionon?</h2>
              <p className="mt-3 text-lg text-muted-foreground">Tre hapa te thjeshte per te filluar.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 lg:gap-12">
              {steps.map((step, index) => (
                <Reveal key={step.number} delay={index * 0.1} className="relative text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-5 font-display text-xl font-bold text-white shadow-lg shadow-primary/30">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="absolute left-[60%] top-8 hidden h-0.5 w-[80%] bg-gradient-to-r from-primary/40 to-transparent md:block" />
                  )}
                  <h3 className="mb-2 font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-muted/40 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold text-foreground lg:text-4xl">
                Cfare Thone Perdoruesit
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Mijera studente dhe instruktore na besojne.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <Reveal key={t.name} delay={i * 0.1}>
                  <Card className="h-full">
                    <CardContent className="flex h-full flex-col p-6">
                      <Quote className="mb-4 h-8 w-8 text-primary/30" />
                      <p className="flex-1 text-sm leading-relaxed text-foreground/80">
                        &ldquo;{t.text}&rdquo;
                      </p>
                      <div className="mt-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {t.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.role}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 py-24">
          <div className="pointer-events-none absolute inset-0 opacity-50 mix-blend-soft-light [background:radial-gradient(30rem_30rem_at_50%_0%,rgba(255,255,255,0.4),transparent_60%)]" />
          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 font-display text-3xl font-bold text-white lg:text-4xl">
                {isAuthenticated
                  ? 'Vazhdo Udhetimin Tend te Mesimit'
                  : 'Gati per te Filluar Udhetimin Tend?'}
              </h2>
              <p className="mb-10 text-lg text-indigo-100">
                {isAuthenticated
                  ? 'Shko ne panelin tend ose shfleto kurse te reja.'
                  : 'Bashkohu me mijera studente dhe instruktore ne platformen tone.'}
              </p>
              <Link href={isAuthenticated ? dashboardPath : '/register'}>
                <Button size="lg" className="bg-card text-primary shadow-lg hover:bg-primary/10">
                  {isAuthenticated ? 'Paneli Kryesor' : 'Krijo Llogari Falas'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-16 text-muted-foreground">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link href="/" className="mb-4 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-5 text-white">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <span className="font-display text-xl font-bold text-foreground">ZK-LMS</span>
              </Link>
              <p className="max-w-md text-sm leading-relaxed">
                Platforma moderne e menaxhimit te mesimit me inteligjence artificiale,
                e ndertuar per te ardhmen e edukimit.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-foreground">Linqe</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/courses" className="transition-colors hover:text-foreground">Kurset</Link></li>
                <li><Link href="/register" className="transition-colors hover:text-foreground">Regjistrohu</Link></li>
                <li><Link href="/login" className="transition-colors hover:text-foreground">Hyr</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-foreground">Kontakt</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>info@zk-lms.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Universiteti i Tiranes</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-border pt-8 text-center text-sm">
            <p>
              &copy; 2026 ZK-LMS. Projekt Diplome — Fakulteti i Shkencave te Natyres,
              Departamenti i Informatikes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

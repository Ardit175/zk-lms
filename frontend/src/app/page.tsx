'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Users,
  Video,
  ArrowRight,
  Brain,
  BarChart3,
  GraduationCap,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

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
  instructor: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  category: {
    name: string;
  } | null;
}

const features = [
  {
    icon: Brain,
    title: 'Kuize me AI',
    description: 'Gjenerimi automatik i kuizeve nga permbajtja e mesimeve me inteligjence artificiale',
  },
  {
    icon: Video,
    title: 'Sesione Live',
    description: 'Sesione ne kohe reale me Q&A dhe chat per nderveprim direkt me instruktorin',
  },
  {
    icon: BarChart3,
    title: 'Gjurmo Progresin',
    description: 'Statistika te detajuara per progresin tend ne cdo kurs dhe modul',
  },
];

const steps = [
  { number: '01', title: 'Krijo Llogarine', description: 'Regjistrohu falas si student ose instruktor' },
  { number: '02', title: 'Regjistrohu ne Kurse', description: 'Shfleto dhe zgjidh kurset qe te interesojne' },
  { number: '03', title: 'Meso & Certifikohu', description: 'Perfundo kurset dhe merr certifikata te verifikueshme' },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomePage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [featuredCourses, setFeaturedCourses] = useState<FeaturedCourse[]>([]);

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

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'Fillestar';
      case 'INTERMEDIATE': return 'Mesatar';
      case 'ADVANCED': return 'Avancuar';
      default: return level;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-bold shadow-lg shadow-indigo-200">
              Z
            </div>
            <span className="text-xl font-bold text-slate-900">ZK-LMS</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Hyr</Button>
            </Link>
            <Link href="/register">
              <Button>Fillo Tani</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-24 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-slate-50" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-100/50 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative">
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-sm px-4 py-1">
                Platforma e te Mesuarit te Ardhmes
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Meso Pa Kufij me{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                  Fuqine e AI
                </span>
              </h1>
              <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Platforma moderne e menaxhimit te mesimit me bashkepunim ne kohe reale,
                kuize te gjeneruara nga AI, dhe gjurmim te plote te progresit.
              </p>
              <motion.div
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Link href="/register">
                  <Button size="lg" className="text-lg px-8 h-12 shadow-lg shadow-indigo-200">
                    Fillo te Mesosh
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/register?role=instructor">
                  <Button size="lg" variant="outline" className="text-lg px-8 h-12">
                    Behu Instruktor
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats Bar */}
        {stats && (
          <section className="py-8 bg-slate-900">
            <div className="container mx-auto px-4">
              <motion.div
                className="flex flex-wrap items-center justify-center gap-8 lg:gap-16"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <div className="text-center">
                  <p className="text-3xl lg:text-4xl font-bold text-white">{stats.courses}+</p>
                  <p className="text-slate-400 mt-1">Kurse</p>
                </div>
                <div className="h-12 w-px bg-slate-700 hidden lg:block" />
                <div className="text-center">
                  <p className="text-3xl lg:text-4xl font-bold text-white">{stats.students}+</p>
                  <p className="text-slate-400 mt-1">Studente</p>
                </div>
                <div className="h-12 w-px bg-slate-700 hidden lg:block" />
                <div className="text-center">
                  <p className="text-3xl lg:text-4xl font-bold text-white">{stats.instructors}+</p>
                  <p className="text-slate-400 mt-1">Instruktore</p>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
                Funksionalitete te Fuqishme
              </h2>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                E gjitha cfare nevojitet per nje eksperience mesimi efektive
              </p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={fadeInUp}
                  className="group"
                >
                  <Card className="h-full border-2 border-transparent hover:border-indigo-200 transition-all duration-300 hover:shadow-xl">
                    <CardContent className="p-8">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <feature.icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Featured Courses */}
        {featuredCourses.length > 0 && (
          <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-4">
              <motion.div
                className="text-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
                  Kurset me Popullarizuara
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Fillo udhetimin tend me kurset tona me te mira
                </p>
              </motion.div>

              <motion.div
                className="grid md:grid-cols-3 gap-8"
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
              >
                {featuredCourses.map((course) => (
                  <motion.div key={course.id} variants={fadeInUp}>
                    <Link href={`/courses/${course.slug}`}>
                      <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 group">
                        <div className="aspect-video bg-slate-200 relative overflow-hidden">
                          {course.thumbnailUrl ? (
                            <img
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-12 w-12 text-slate-400" />
                            </div>
                          )}
                          <Badge className="absolute top-3 left-3 bg-white/90">
                            {getLevelLabel(course.level)}
                          </Badge>
                        </div>
                        <CardContent className="p-5">
                          {course.category && (
                            <p className="text-sm text-indigo-600 font-medium mb-2">
                              {course.category.name}
                            </p>
                          )}
                          <h3 className="font-semibold text-slate-900 text-lg mb-2 line-clamp-2">
                            {course.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                            <span>{course.instructor.firstName} {course.instructor.lastName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm text-slate-500">
                              <Users className="h-4 w-4" />
                              <span>{course.enrollmentCount} studente</span>
                            </div>
                            <Button size="sm">Regjistrohu</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              <div className="text-center mt-12">
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

        {/* How It Works */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
                Si Funksionon?
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Tre hapa te thjeshte per te filluar
              </p>
            </motion.div>

            <motion.div
              className="grid md:grid-cols-3 gap-8 lg:gap-12"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  variants={fadeInUp}
                  className="text-center relative"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-indigo-200 to-transparent" />
                  )}
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-600">{step.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-indigo-600 to-indigo-700">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-3xl mx-auto text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                Gati per te Filluar Udhetimin Tend?
              </h2>
              <p className="text-xl text-indigo-100 mb-10">
                Bashkohu me mijera studente dhe instruktore ne platformen tone
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 text-lg px-8 h-12">
                    Krijo Llogari Falas
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">
                  Z
                </div>
                <span className="text-xl font-bold text-white">ZK-LMS</span>
              </Link>
              <p className="text-slate-400 max-w-md">
                Platforma moderne e menaxhimit te mesimit me inteligjence artificiale,
                e ndertuar per te ardhmen e edukimit.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Linqe</h4>
              <ul className="space-y-2">
                <li><Link href="/courses" className="hover:text-white transition-colors">Kurset</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Regjistrohu</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Hyr</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Kontakt</h4>
              <ul className="space-y-2">
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
          <div className="border-t border-slate-800 mt-12 pt-8 text-center">
            <p>
              &copy; 2026 ZK-LMS. Projekt Diplome - Fakulteti i Shkencave te Natyres, Departamenti i Informatikes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

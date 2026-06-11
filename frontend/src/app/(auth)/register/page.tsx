'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore, getRedirectPath } from '@/stores/auth-store';
import { registerSchema, RegisterInput } from '@/lib/validations/auth';
import { al } from '@/lib/i18n/al';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Loader2, GraduationCap, BookOpen } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') === 'instructor' ? 'INSTRUCTOR' : 'STUDENT';

  const { register: registerUser, isLoading } = useAuthStore();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: defaultRole as 'INSTRUCTOR' | 'STUDENT',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterInput) => {
    setServerError('');
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      });
      const user = useAuthStore.getState().user;
      if (user) {
        router.push(getRedirectPath(user.role));
      }
    } catch (error) {
      if (error instanceof Error) {
        setServerError(error.message);
      } else {
        setServerError('Regjistrimi deshtoi. Provoni perseri.');
      }
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      {/* animated gradient mesh + dot grid */}
      <div className="mesh-bg" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] [background-size:24px_24px] opacity-40" />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <Card className="relative w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Link
            href="/"
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-5 text-white shadow-sm shadow-primary/30"
          >
            <GraduationCap className="h-6 w-6" />
          </Link>
          <CardTitle className="text-2xl">Krijoni nje llogari</CardTitle>
          <CardDescription>Filloni udhetimin tuaj te te mesuarit sot</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{al.auth.firstName}</Label>
                <Input
                  id="firstName"
                  placeholder="Emri"
                  {...register('firstName')}
                  className={errors.firstName ? 'border-destructive' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{al.auth.lastName}</Label>
                <Input
                  id="lastName"
                  placeholder="Mbiemri"
                  {...register('lastName')}
                  className={errors.lastName ? 'border-destructive' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{al.auth.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@shembull.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{al.auth.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder="Krijoni nje fjalekalim"
                {...register('password')}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmo fjalekalimin</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Konfirmo fjalekalimin"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-destructive' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Deshiroj te</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('role', 'STUDENT')}
                  className={`press rounded-xl border-2 p-4 text-center transition-colors ${
                    selectedRole === 'STUDENT'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-foreground hover:border-primary/40'
                  }`}
                >
                  <GraduationCap className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Mesoj</div>
                  <div className="text-sm text-muted-foreground">Si student</div>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('role', 'INSTRUCTOR')}
                  className={`press rounded-xl border-2 p-4 text-center transition-colors ${
                    selectedRole === 'INSTRUCTOR'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-foreground hover:border-primary/40'
                  }`}
                >
                  <BookOpen className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Mesoj te tjeret</div>
                  <div className="text-sm text-muted-foreground">Si instruktor</div>
                </button>
              </div>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Duke krijuar llogarine...
                </>
              ) : (
                'Krijo llogarine'
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {al.auth.hasAccount}{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {al.auth.login}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Duke ngarkuar...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore, getRedirectPath } from '@/stores/auth-store';
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { al } from '@/lib/i18n/al';
import { Loader2, GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError('');
    try {
      await login(data.email, data.password);
      const user = useAuthStore.getState().user;
      if (user) {
        router.push(getRedirectPath(user.role));
      }
    } catch (error) {
      if (error instanceof Error) {
        setServerError(error.message);
      } else {
        setServerError('Login deshtoi. Provoni perseri.');
      }
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      {/* subtle dot pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.200)_1px,transparent_0)] [background-size:24px_24px]" />
      <Card className="relative w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <Link
            href="/"
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-200"
          >
            <GraduationCap className="h-6 w-6" />
          </Link>
          <CardTitle className="text-2xl">Miresevini perseri</CardTitle>
          <CardDescription>Vendosni kredencialet tuaja per te hyre</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {serverError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{al.auth.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@shembull.com"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{al.auth.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder="Vendosni fjalekalimin"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Duke hyre...
                </>
              ) : (
                al.auth.login
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            {al.auth.noAccount}{' '}
            <Link href="/register" className="text-indigo-600 hover:underline font-medium">
              {al.auth.register}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

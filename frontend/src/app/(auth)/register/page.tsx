'use client';

import { useState } from 'react';
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
import { Loader2, GraduationCap, BookOpen } from 'lucide-react';

export default function RegisterPage() {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white text-xl font-bold">
            Z
          </div>
          <CardTitle className="text-2xl">Krijoni nje llogari</CardTitle>
          <CardDescription>Filloni udhetimin tuaj te te mesuarit sot</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Emri</Label>
                <Input
                  id="firstName"
                  placeholder="Emri"
                  {...register('firstName')}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Mbiemri</Label>
                <Input
                  id="lastName"
                  placeholder="Mbiemri"
                  {...register('lastName')}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Fjalekalimi</Label>
              <Input
                id="password"
                type="password"
                placeholder="Krijoni nje fjalekalim"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmo fjalekalimin</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Konfirmo fjalekalimin"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Deshiroj te</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('role', 'STUDENT')}
                  className={`rounded-lg border-2 p-4 text-center transition-colors ${
                    selectedRole === 'STUDENT'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <GraduationCap className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Mesoj</div>
                  <div className="text-sm text-slate-500">Si student</div>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('role', 'INSTRUCTOR')}
                  className={`rounded-lg border-2 p-4 text-center transition-colors ${
                    selectedRole === 'INSTRUCTOR'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <BookOpen className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Mesoj te tjeret</div>
                  <div className="text-sm text-slate-500">Si instruktor</div>
                </button>
              </div>
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role.message}</p>
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
          <p className="mt-6 text-center text-sm text-slate-600">
            Keni tashme nje llogari?{' '}
            <Link href="/login" className="text-indigo-600 hover:underline font-medium">
              Hyni
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

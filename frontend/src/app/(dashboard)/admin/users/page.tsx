'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Search,
  MoreVertical,
  User,
  Shield,
  GraduationCap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { adminApi, type AdminUser } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

const ROLE_CONFIG = {
  ADMIN: { label: 'Admin', icon: Shield, color: 'bg-red-100 text-red-700' },
  INSTRUCTOR: { label: 'Instruktor', icon: BookOpen, color: 'bg-indigo-100 text-indigo-700' },
  STUDENT: { label: 'Student', icon: GraduationCap, color: 'bg-green-100 text-green-700' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadUsers();
  }, [pagination.page, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((p) => ({ ...p, page: 1 }));
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getUsers({
        search: searchQuery || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (res.data) {
        setUsers(res.data.users);
        setPagination((p) => ({
          ...p,
          total: res.data!.pagination.total,
          totalPages: res.data!.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await adminApi.updateUser(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as AdminUser['role'] } : u))
      );
    } catch (error) {
      console.error('Failed to change role:', error);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await adminApi.updateUser(userId, { isActive: !isActive });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !isActive } : u))
      );
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Jeni te sigurt qe deshironi te deaktivizoni kete perdorues?')) return;
    try {
      await adminApi.deleteUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: false } : u)));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Perdoruesit</h1>
            <p className="text-slate-500 mt-1">Menaxho perdoruesit e platformes</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Kerko sipas emrit ose emailit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Te gjitha rolet</option>
                <option value="ADMIN">Admin</option>
                <option value="INSTRUCTOR">Instruktor</option>
                <option value="STUDENT">Student</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Te gjitha statuset</option>
                <option value="active">Aktiv</option>
                <option value="inactive">Joaktiv</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y divide-slate-100">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                Nuk u gjeten perdorues
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Perdoruesi
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Roli
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Statusi
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Regjistruar
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Aktiviteti
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Veprime
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => {
                      const roleConfig = ROLE_CONFIG[user.role];
                      return (
                        <tr
                          key={user.id}
                          className="odd:bg-slate-50/50 transition-colors hover:bg-indigo-50/60"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {user.avatarUrl ? (
                                <Image
                                  src={user.avatarUrl}
                                  alt={`${user.firstName} ${user.lastName}`}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                                  <User className="h-5 w-5 text-slate-500" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-slate-900">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                                roleConfig.color
                              )}
                            >
                              <roleConfig.icon className="h-3 w-3" />
                              {roleConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={user.isActive ? 'success' : 'destructive'}>
                              {user.isActive ? 'Aktiv' : 'Joaktiv'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {new Date(user.createdAt).toLocaleDateString('sq-AL')}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {user.role === 'INSTRUCTOR' ? (
                              <span>{user._count.coursesCreated} kurse</span>
                            ) : user.role === 'STUDENT' ? (
                              <span>{user._count.enrollments} regjistrime</span>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleToggleActive(user.id, user.isActive)}
                                >
                                  {user.isActive ? 'Deaktivizo' : 'Aktivizo'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleChangeRole(user.id, 'ADMIN')}
                                  disabled={user.role === 'ADMIN'}
                                >
                                  Beje Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleChangeRole(user.id, 'INSTRUCTOR')}
                                  disabled={user.role === 'INSTRUCTOR'}
                                >
                                  Beje Instruktor
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleChangeRole(user.id, 'STUDENT')}
                                  disabled={user.role === 'STUDENT'}
                                >
                                  Beje Student
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(user.id)}
                                  className="text-red-600"
                                >
                                  Fshi
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
            <p className="text-sm text-slate-500">
              Duke shfaqur {(pagination.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} nga{' '}
              {pagination.total} perdorues
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
              <span className="text-sm text-slate-700">
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

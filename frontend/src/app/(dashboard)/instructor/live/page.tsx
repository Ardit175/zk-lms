'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Play,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { liveSessionsApi, type LiveSession } from '@/lib/api/live-sessions';
import { coursesApi, type Course } from '@/lib/api/courses';
import { cn } from '@/lib/utils';

export default function InstructorLiveSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [newSession, setNewSession] = useState({
    courseId: '',
    title: '',
    description: '',
    scheduledAt: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sessionsRes, coursesRes] = await Promise.all([
        liveSessionsApi.getMySessions(),
        coursesApi.getInstructorCourses(),
      ]);
      if (sessionsRes.data) setSessions(sessionsRes.data);
      if (coursesRes.data) setCourses(coursesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newSession.courseId || !newSession.title || !newSession.scheduledAt) return;

    setIsCreating(true);
    try {
      const res = await liveSessionsApi.create({
        courseId: newSession.courseId,
        title: newSession.title,
        description: newSession.description || undefined,
        scheduledAt: new Date(newSession.scheduledAt).toISOString(),
      });

      if (res.data) {
        setSessions((prev) => [res.data!, ...prev]);
        setIsCreateOpen(false);
        setNewSession({ courseId: '', title: '', description: '', scheduledAt: '' });
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const scheduledSessions = sessions.filter((s) => s.status === 'SCHEDULED');
  const liveSessions = sessions.filter((s) => s.status === 'LIVE');
  const endedSessions = sessions.filter((s) => s.status === 'ENDED');

  return (
    <DashboardLayout role="INSTRUCTOR">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sesionet Live</h1>
            <p className="text-slate-500 mt-1">Menaxhoni sesionet tuaja live</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Sesion i Ri
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Krijo Sesion te Ri</DialogTitle>
                <DialogDescription>
                  Planifikoni nje sesion live per studentet tuaj
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Kursi</Label>
                  <Select
                    value={newSession.courseId}
                    onValueChange={(value) => setNewSession((prev) => ({ ...prev, courseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Zgjidh kursin" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Titulli</Label>
                  <Input
                    value={newSession.title}
                    onChange={(e) => setNewSession((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="p.sh. Sesion Q&A per Modulin 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pershkrimi (opsional)</Label>
                  <Textarea
                    value={newSession.description}
                    onChange={(e) => setNewSession((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Pershkruani sesionin..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data dhe Ora</Label>
                  <Input
                    type="datetime-local"
                    value={newSession.scheduledAt}
                    onChange={(e) => setNewSession((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Anulo
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !newSession.courseId || !newSession.title || !newSession.scheduledAt}
                >
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Krijo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Video className="h-12 w-12 mb-4 text-slate-300" />
              <p className="text-lg font-medium">Asnje sesion live</p>
              <p className="text-sm mt-1">Krijoni sesionin tuaj te pare live</p>
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Sesion i Ri
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Live Now */}
            {liveSessions.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                  Live Tani
                </h2>
                <div className="grid gap-4">
                  {liveSessions.map((session) => (
                    <SessionCard key={session.id} session={session} onNavigate={() => router.push(`/instructor/live/${session.id}`)} />
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled */}
            {scheduledSessions.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Te Planifikuara</h2>
                <div className="grid gap-4">
                  {scheduledSessions.map((session) => (
                    <SessionCard key={session.id} session={session} onNavigate={() => router.push(`/instructor/live/${session.id}`)} />
                  ))}
                </div>
              </div>
            )}

            {/* Ended */}
            {endedSessions.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Te Perfunduara</h2>
                <div className="grid gap-4">
                  {endedSessions.map((session) => (
                    <SessionCard key={session.id} session={session} onNavigate={() => router.push(`/instructor/live/${session.id}`)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function SessionCard({ session, onNavigate }: { session: LiveSession; onNavigate: () => void }) {
  return (
    <Card
      className={cn(
        'cursor-pointer hover:border-indigo-300 transition-colors',
        session.status === 'LIVE' && 'border-red-300 bg-red-50/50'
      )}
      onClick={onNavigate}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-slate-900">{session.title}</h3>
              <Badge
                variant={
                  session.status === 'LIVE'
                    ? 'destructive'
                    : session.status === 'SCHEDULED'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {session.status === 'LIVE' ? 'LIVE' : session.status === 'SCHEDULED' ? 'Planifikuar' : 'Perfunduar'}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">{session.course.title}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(session.scheduledAt), 'dd MMM yyyy', { locale: sq })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(session.scheduledAt), 'HH:mm')}
              </span>
              {session._count && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {session._count.questions} pyetje
                </span>
              )}
            </div>
          </div>
          {session.status === 'SCHEDULED' && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" />
              Fillo
            </Button>
          )}
          {session.status === 'LIVE' && (
            <Button size="sm" variant="destructive">
              Hyr ne Sesion
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

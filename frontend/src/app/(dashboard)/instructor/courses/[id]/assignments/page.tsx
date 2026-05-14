'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';
import {
  ArrowLeft,
  FileText,
  Upload,
  Link as LinkIcon,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { assignmentsApi, CourseAssignment, SubmissionType } from '@/lib/api/assignments';
import { cn } from '@/lib/utils';

export default function InstructorCourseAssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setIsLoading(true);
        const res = await assignmentsApi.getCourseAssignments(courseId);
        if (res.data) {
          setAssignments(res.data.assignments);
          setCourseTitle(res.data.courseTitle);
        }
      } catch (err) {
        console.error('Failed to load assignments:', err);
        setError('Deshtoi te ngarkonte detyrat');
      } finally {
        setIsLoading(false);
      }
    };

    loadAssignments();
  }, [courseId]);

  const getSubmissionTypeIcon = (type: SubmissionType) => {
    switch (type) {
      case 'TEXT':
        return <FileText className="h-4 w-4" />;
      case 'FILE':
        return <Upload className="h-4 w-4" />;
      case 'LINK':
        return <LinkIcon className="h-4 w-4" />;
    }
  };

  const getSubmissionTypeLabel = (type: SubmissionType) => {
    switch (type) {
      case 'TEXT':
        return 'Tekst';
      case 'FILE':
        return 'Skedar';
      case 'LINK':
        return 'Link';
    }
  };

  const totalStats = {
    totalAssignments: assignments.length,
    totalSubmissions: assignments.reduce((sum, a) => sum + a.totalSubmissions, 0),
    totalGraded: assignments.reduce((sum, a) => sum + a.gradedCount, 0),
    totalUngraded: assignments.reduce((sum, a) => sum + a.ungradedCount, 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
        <Button onClick={() => router.back()}>Kthehu</Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="text-sm text-slate-500 mb-1">Kursi: {courseTitle}</div>
          <h1 className="text-2xl font-bold text-slate-900">Detyrat</h1>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalStats.totalAssignments}</p>
                <p className="text-sm text-slate-500">Detyra totale</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalStats.totalSubmissions}</p>
                <p className="text-sm text-slate-500">Dergesa totale</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalStats.totalGraded}</p>
                <p className="text-sm text-slate-500">Te vleresuara</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalStats.totalUngraded}</p>
                <p className="text-sm text-slate-500">Per vleresim</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Table */}
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-medium text-slate-900 mb-2">Asnje detyre</h3>
              <p className="text-slate-500">Ky kurs nuk ka detyra te krijuara.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Te gjitha detyrat</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Detyra</TableHead>
                  <TableHead>Tipi</TableHead>
                  <TableHead>Afati</TableHead>
                  <TableHead>Dergesa</TableHead>
                  <TableHead>Mesatarja</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id} className="cursor-pointer hover:bg-slate-50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{assignment.title}</p>
                        <p className="text-sm text-slate-500">{assignment.lessonTitle}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {getSubmissionTypeIcon(assignment.submissionType)}
                        {getSubmissionTypeLabel(assignment.submissionType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignment.dueDate ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {format(new Date(assignment.dueDate), 'dd MMM yyyy', { locale: sq })}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-900 font-medium">
                            {assignment.gradedCount}/{assignment.totalSubmissions}
                          </span>
                          {assignment.ungradedCount > 0 && (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                              {assignment.ungradedCount} per vleresim
                            </Badge>
                          )}
                        </div>
                        {assignment.totalSubmissions > 0 && (
                          <Progress
                            value={(assignment.gradedCount / assignment.totalSubmissions) * 100}
                            className="h-1.5"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.averageScore !== null ? (
                        <span className="font-medium">
                          {assignment.averageScore}/{assignment.maxScore}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/instructor/assignments/${assignment.id}/submissions`}>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

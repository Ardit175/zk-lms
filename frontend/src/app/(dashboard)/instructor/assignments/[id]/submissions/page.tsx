'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { sq } from 'date-fns/locale';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  FileText,
  Upload,
  Link as LinkIcon,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Award,
  ExternalLink,
  FileIcon,
  User,
  Command,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  assignmentsApi,
  Assignment,
  AssignmentSubmission,
  GradeSubmissionInput,
} from '@/lib/api/assignments';
import { cn } from '@/lib/utils';

export default function AssignmentSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    graded: number;
    ungraded: number;
    averageScore: number | null;
  } | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Grading form
  const [score, setScore] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  const scoreInputRef = useRef<HTMLInputElement>(null);

  const loadSubmissions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await assignmentsApi.getSubmissions(assignmentId);
      if (res.data) {
        setAssignment(res.data.assignment);
        setSubmissions(res.data.submissions);
        setStats(res.data.stats);
        if (res.data.submissions.length > 0 && !selectedSubmission) {
          selectSubmission(res.data.submissions[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setError('Deshtoi te ngarkonte dergesat');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const selectSubmission = (submission: AssignmentSubmission) => {
    setSelectedSubmission(submission);
    setScore(submission.score?.toString() || '');
    setFeedback(submission.feedback || '');
    setError(null);
  };

  const handleGrade = async () => {
    if (!selectedSubmission || !assignment) return;

    const scoreNum = parseInt(score, 10);
    if (isNaN(scoreNum) || scoreNum < 0) {
      setError('Ju lutem vendosni nje rezultat te vlefshem');
      return;
    }
    if (scoreNum > assignment.maxScore) {
      setError(`Rezultati maksimal eshte ${assignment.maxScore}`);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await assignmentsApi.gradeSubmission(selectedSubmission.id, {
        score: scoreNum,
        feedback: feedback.trim() || undefined,
      });

      if (res.data) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === selectedSubmission.id ? res.data! : s))
        );
        setSelectedSubmission(res.data);

        // Update stats
        setStats((prev) => {
          if (!prev) return prev;
          const wasGraded = selectedSubmission.gradedAt !== null;
          return {
            ...prev,
            graded: wasGraded ? prev.graded : prev.graded + 1,
            ungraded: wasGraded ? prev.ungraded : prev.ungraded - 1,
          };
        });

        // Move to next ungraded
        const currentIndex = submissions.findIndex((s) => s.id === selectedSubmission.id);
        const nextUngraded = submissions.find(
          (s, i) => i > currentIndex && s.gradedAt === null
        );
        if (nextUngraded) {
          selectSubmission(nextUngraded);
        }
      }
    } catch (err) {
      console.error('Grade failed:', err);
      setError('Deshtoi te vleresonte');
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleGrade();
        return;
      }

      if (!selectedSubmission) return;

      const currentIndex = submissions.findIndex((s) => s.id === selectedSubmission.id);

      if (e.key === 'ArrowUp' && e.altKey) {
        e.preventDefault();
        if (currentIndex > 0) {
          selectSubmission(submissions[currentIndex - 1]);
        }
      } else if (e.key === 'ArrowDown' && e.altKey) {
        e.preventDefault();
        if (currentIndex < submissions.length - 1) {
          selectSubmission(submissions[currentIndex + 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSubmission, submissions]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !assignment) {
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

  if (!assignment) {
    return (
      <div className="p-8">
        <p className="text-slate-600">Detyra nuk u gjet</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{assignment.title}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {stats?.total || 0} dergesa
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {stats?.graded || 0} te vleresuara
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-amber-600" />
                {stats?.ungraded || 0} per vleresim
              </span>
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">Alt</kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded"><ArrowUp className="h-3 w-3" /></kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded"><ArrowDown className="h-3 w-3" /></kbd>
            Navigo
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">Ctrl</kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">Enter</kbd>
            Ruaj
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Submissions List */}
        <div className="w-80 border-r border-slate-200 bg-white flex-shrink-0">
          <ScrollArea className="h-full">
            <div className="p-2">
              {submissions.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p>Asnje dergese ende</p>
                </div>
              ) : (
                submissions.map((submission) => (
                  <button
                    key={submission.id}
                    onClick={() => selectSubmission(submission)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg mb-1 transition-colors',
                      selectedSubmission?.id === submission.id
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={submission.student?.avatarUrl || undefined} />
                        <AvatarFallback>
                          {submission.student
                            ? getInitials(submission.student.firstName, submission.student.lastName)
                            : 'ST'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {submission.student
                            ? `${submission.student.firstName} ${submission.student.lastName}`
                            : 'Student'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {format(new Date(submission.submittedAt), 'dd MMM, HH:mm', { locale: sq })}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {submission.gradedAt ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            {submission.score}/{assignment.maxScore}
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                            <Clock className="h-3 w-3 mr-1" />
                            Pret
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Detail/Grading Panel */}
        <div className="flex-1 overflow-hidden bg-slate-50">
          {selectedSubmission ? (
            <ScrollArea className="h-full">
              <div className="p-6 max-w-3xl mx-auto">
                {/* Student Info */}
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={selectedSubmission.student?.avatarUrl || undefined} />
                        <AvatarFallback>
                          {selectedSubmission.student
                            ? getInitials(
                                selectedSubmission.student.firstName,
                                selectedSubmission.student.lastName
                              )
                            : 'ST'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>
                          {selectedSubmission.student
                            ? `${selectedSubmission.student.firstName} ${selectedSubmission.student.lastName}`
                            : 'Student'}
                        </CardTitle>
                        {selectedSubmission.student && (
                          <p className="text-sm text-slate-500">{selectedSubmission.student.email}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500">
                      Derguar me{' '}
                      {format(new Date(selectedSubmission.submittedAt), 'dd MMMM yyyy, HH:mm', {
                        locale: sq,
                      })}
                    </p>
                  </CardContent>
                </Card>

                {/* Submission Content */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Permbajtja e Dergeses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedSubmission.content && (
                      <div
                        className="prose prose-slate prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedSubmission.content }}
                      />
                    )}

                    {selectedSubmission.fileUrl && (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                        <FileIcon className="h-8 w-8 text-slate-400" />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">Skedar i ngarkuar</p>
                        </div>
                        <a
                          href={selectedSubmission.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Shiko
                        </a>
                      </div>
                    )}

                    {selectedSubmission.linkUrl && (
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                        <LinkIcon className="h-8 w-8 text-slate-400" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 mb-1">Link</p>
                          <a
                            href={selectedSubmission.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-700 truncate block"
                          >
                            {selectedSubmission.linkUrl}
                          </a>
                        </div>
                        <a
                          href={selectedSubmission.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Hap
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Grading Form */}
                <Card className="border-indigo-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5 text-indigo-600" />
                      Vleresimi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="score" className="mb-2 block">
                          Rezultati (maks. {assignment.maxScore})
                        </Label>
                        <Input
                          ref={scoreInputRef}
                          id="score"
                          type="number"
                          min="0"
                          max={assignment.maxScore}
                          value={score}
                          onChange={(e) => setScore(e.target.value)}
                          placeholder={`0 - ${assignment.maxScore}`}
                          className="text-lg font-semibold"
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="text-3xl font-bold text-slate-400">
                          /{assignment.maxScore}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="feedback" className="mb-2 block">
                        Feedback (opsional)
                      </Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Shkruani feedback per studentin..."
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      {selectedSubmission.gradedAt && (
                        <p className="text-sm text-slate-500">
                          Vleresuar me pare me{' '}
                          {format(new Date(selectedSubmission.gradedAt), 'dd MMM yyyy, HH:mm', {
                            locale: sq,
                          })}
                        </p>
                      )}
                      <Button
                        onClick={handleGrade}
                        disabled={isSaving || !score}
                        className="ml-auto"
                        size="lg"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Duke ruajtur...
                          </>
                        ) : selectedSubmission.gradedAt ? (
                          'Perditeso Vleresimin'
                        ) : (
                          'Ruaj Vleresimin'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Zgjidhni nje dergese per te pare detajet</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

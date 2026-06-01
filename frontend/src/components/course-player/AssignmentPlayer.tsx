'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow, isPast, differenceInHours } from 'date-fns';
import { sq } from 'date-fns/locale';
import {
  FileText,
  Upload,
  Link as LinkIcon,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  X,
  FileIcon,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { assignmentsApi, Assignment, AssignmentSubmission, SubmissionType } from '@/lib/api/assignments';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { resolveFileUrl } from '@/lib/fileUrl';

interface AssignmentPlayerProps {
  lessonId: string;
  onComplete: () => void;
}

export function AssignmentPlayer({ lessonId, onComplete }: AssignmentPlayerProps) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [textContent, setTextContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    filename: string;
    originalName: string;
    size: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const assignmentRes = await assignmentsApi.getByLesson(lessonId);
      if (assignmentRes.data) {
        setAssignment(assignmentRes.data);

        const submissionRes = await assignmentsApi.getMySubmission(assignmentRes.data.id);
        if (submissionRes.data) {
          setSubmission(submissionRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to load assignment:', err);
      setError('Deshtoi te ngarkonte detyren');
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('Skedari eshte shume i madh. Maksimumi eshte 10MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const res = await assignmentsApi.uploadFile(file);
      if (res.data) {
        setUploadedFile(res.data);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Deshtoi te ngarkonte skedarin');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleSubmit = async () => {
    if (!assignment) return;

    const submissionData: { content?: string; fileUrl?: string; linkUrl?: string } = {};

    switch (assignment.submissionType) {
      case 'TEXT':
        if (!textContent.trim()) {
          setError('Ju lutem shkruani permbajtjen e detyres');
          return;
        }
        submissionData.content = textContent;
        break;
      case 'FILE':
        if (!uploadedFile) {
          setError('Ju lutem ngarkoni nje skedar');
          return;
        }
        submissionData.fileUrl = uploadedFile.url;
        break;
      case 'LINK':
        if (!linkUrl.trim()) {
          setError('Ju lutem vendosni linkun');
          return;
        }
        try {
          const parsed = new URL(linkUrl);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            setError('Linku duhet te filloje me http:// ose https://');
            return;
          }
        } catch {
          setError('Ju lutem vendosni nje URL te vlefshme');
          return;
        }
        submissionData.linkUrl = linkUrl;
        break;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await assignmentsApi.submit(assignment.id, submissionData);
      if (res.data) {
        setSubmission(res.data);
        onComplete();
      }
    } catch (err) {
      console.error('Submit failed:', err);
      setError('Deshtoi te dergonte detyren');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDueDateStatus = () => {
    if (!assignment?.dueDate) return null;

    const dueDate = new Date(assignment.dueDate);
    const hoursUntilDue = differenceInHours(dueDate, new Date());

    if (isPast(dueDate)) {
      return { type: 'overdue', text: 'E kaluar afati', color: 'text-red-600 bg-red-50' };
    }
    if (hoursUntilDue < 24) {
      return { type: 'urgent', text: `${hoursUntilDue}h te mbetura`, color: 'text-amber-600 bg-amber-50' };
    }
    return { type: 'normal', text: formatDistanceToNow(dueDate, { locale: sq, addSuffix: true }), color: 'text-slate-600 bg-slate-50' };
  };

  const getSubmissionTypeIcon = (type: SubmissionType) => {
    switch (type) {
      case 'TEXT':
        return <FileText className="h-5 w-5" />;
      case 'FILE':
        return <Upload className="h-5 w-5" />;
      case 'LINK':
        return <LinkIcon className="h-5 w-5" />;
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <p className="text-slate-600">Detyra nuk u gjet</p>
      </div>
    );
  }

  const dueDateStatus = getDueDateStatus();

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">{assignment.title}</h2>
            <p className="text-slate-600">{assignment.description}</p>
          </div>
          <div className="flex-shrink-0">
            {submission ? (
              submission.gradedAt ? (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Vleresuar
                </Badge>
              ) : (
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Derguar
                </Badge>
              )
            ) : dueDateStatus?.type === 'overdue' ? (
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                E kaluar
              </Badge>
            ) : (
              <Badge variant="outline">
                {getSubmissionTypeIcon(assignment.submissionType)}
                <span className="ml-1">{getSubmissionTypeLabel(assignment.submissionType)}</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          {assignment.dueDate && (
            <div className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-sm', dueDateStatus?.color)}>
              <Calendar className="h-4 w-4" />
              <span>Afati: {format(new Date(assignment.dueDate), 'dd MMM yyyy, HH:mm', { locale: sq })}</span>
              {dueDateStatus && <span className="font-medium">({dueDateStatus.text})</span>}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Award className="h-4 w-4" />
            <span>Maksimumi: {assignment.maxScore} pike</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <h3 className="font-medium text-slate-900 mb-3">Udhezime</h3>
        <div
          className="prose prose-slate prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(assignment.instructions) }}
        />
      </div>

      {/* Submission Form or Status */}
      <div className="p-6">
        {submission ? (
          // Show submission status
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Dergesa juaj
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-slate-500">
                  Derguar me {format(new Date(submission.submittedAt), 'dd MMMM yyyy, HH:mm', { locale: sq })}
                </div>

                {submission.content && (
                  <div>
                    <Label className="text-slate-500 mb-2 block">Permbajtja:</Label>
                    <div
                      className="prose prose-slate prose-sm max-w-none p-4 bg-slate-50 rounded-lg"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(submission.content) }}
                    />
                  </div>
                )}

                {submission.fileUrl && (
                  <div>
                    <Label className="text-slate-500 mb-2 block">Skedari:</Label>
                    <a
                      href={resolveFileUrl(submission.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm transition-colors"
                    >
                      <FileIcon className="h-4 w-4" />
                      <span>Shiko skedarin</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}

                {submission.linkUrl && (
                  <div>
                    <Label className="text-slate-500 mb-2 block">Linku:</Label>
                    <a
                      href={submission.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span>{submission.linkUrl}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Grading result */}
            {submission.gradedAt && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                    <Award className="h-5 w-5" />
                    Rezultati
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-green-700">
                      {submission.score}/{assignment.maxScore}
                    </div>
                    <div className="text-sm text-slate-500">
                      Vleresuar me {format(new Date(submission.gradedAt), 'dd MMMM yyyy', { locale: sq })}
                      {submission.gradedBy && (
                        <span> nga {submission.gradedBy.firstName} {submission.gradedBy.lastName}</span>
                      )}
                    </div>
                  </div>

                  {submission.feedback && (
                    <div>
                      <Label className="text-slate-600 mb-2 block">Feedback:</Label>
                      <div className="p-4 bg-white rounded-lg border border-green-200 text-slate-700">
                        {submission.feedback}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Show submission form
          <div className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {assignment.submissionType === 'TEXT' && (
              <div>
                <Label className="mb-2 block">Pergjigja juaj</Label>
                <RichTextEditor
                  content={textContent}
                  onChange={setTextContent}
                  placeholder="Shkruani pergjigjen tuaj ketu..."
                />
              </div>
            )}

            {assignment.submissionType === 'FILE' && (
              <div>
                <Label className="mb-2 block">Ngarkoni skedarin</Label>
                {uploadedFile ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <FileIcon className="h-8 w-8 text-green-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{uploadedFile.originalName}</p>
                      <p className="text-sm text-slate-500">{formatFileSize(uploadedFile.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setUploadedFile(null)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                      dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-slate-400',
                      isUploading && 'pointer-events-none opacity-60'
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                        <p className="text-slate-600">Duke ngarkuar...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600 mb-1">
                          Terhiqni skedarin ketu ose <span className="text-indigo-600">klikoni per te zgjedhur</span>
                        </p>
                        <p className="text-sm text-slate-400">PDF, DOC, DOCX, JPG, PNG, GIF, WEBP (max 10MB)</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {assignment.submissionType === 'LINK' && (
              <div>
                <Label htmlFor="link-url" className="mb-2 block">
                  Vendosni linkun
                </Label>
                <Input
                  id="link-url"
                  type="url"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <p className="text-sm text-slate-500 mt-1.5">
                  P.sh. link per GitHub, Google Drive, ose faqe tjeter
                </p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Duke derguar...
                  </>
                ) : (
                  'Dergo Detyren'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

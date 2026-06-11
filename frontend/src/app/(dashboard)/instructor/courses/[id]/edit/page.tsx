'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
  Trash2,
  ArrowLeft,
  Loader2,
  Sparkles,
  Upload,
  Link2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { coursesApi, categoriesApi, type Course, type Module, type Lesson, type Category } from '@/lib/api/courses';
import { quizzesApi, type QuizWithQuestions } from '@/lib/api/quizzes';
import { uploadsApi, VIDEO_MAX_BYTES, PDF_MAX_BYTES } from '@/lib/api/uploads';
import { AIQuizGenerator } from '@/components/instructor/AIQuizGenerator';
import { AssignmentEditor } from '@/components/instructor/AssignmentEditor';
import { assignmentsApi } from '@/lib/api/assignments';
import { VideoPlayer } from '@/components/course-player/VideoPlayer';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(
  () => import('@/components/editor/RichTextEditor').then((mod) => mod.RichTextEditor),
  { ssr: false }
);

const LESSON_ICONS = {
  VIDEO: Video,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
};

const STATUS_BADGES: Record<Course['status'], { label: string; variant: 'draft' | 'warning' | 'success' | 'destructive' }> = {
  DRAFT: { label: 'Draft', variant: 'draft' },
  PENDING_REVIEW: { label: 'Ne Pritje', variant: 'warning' },
  PUBLISHED: { label: 'Publikuar', variant: 'success' },
  ARCHIVED: { label: 'Arkivuar', variant: 'destructive' },
};

interface SortableModuleProps {
  module: Module;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectLesson: (lesson: Lesson) => void;
  selectedLessonId?: string;
  onAddLesson: () => void;
  onDeleteModule: () => void;
  courseId: string;
  onLessonsReorder: (moduleId: string, lessons: Lesson[]) => void;
}

function SortableModule({
  module,
  isExpanded,
  onToggle,
  onSelectLesson,
  selectedLessonId,
  onAddLesson,
  onDeleteModule,
  courseId,
  onLessonsReorder,
}: SortableModuleProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleLessonDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = module.lessons.findIndex((l) => l.id === active.id);
    const newIndex = module.lessons.findIndex((l) => l.id === over.id);

    const newLessons = [...module.lessons];
    const [removed] = newLessons.splice(oldIndex, 1);
    newLessons.splice(newIndex, 0, removed);

    const reordered = newLessons.map((l, i) => ({ ...l, orderIndex: i }));
    onLessonsReorder(module.id, reordered);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-card rounded-lg border border-border overflow-hidden',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-2 p-3 bg-muted/50 border-b border-border">
        <button {...attributes} {...listeners} className="cursor-grab hover:text-primary">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <button onClick={onToggle} className="flex-1 flex items-center gap-2 text-left">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium text-foreground">{module.title}</span>
          <span className="text-sm text-muted-foreground">({module.lessons.length} mesime)</span>
        </button>
        <button
          onClick={onDeleteModule}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="p-2">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
            <SortableContext items={module.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              {module.lessons.map((lesson) => (
                <SortableLesson
                  key={lesson.id}
                  lesson={lesson}
                  isSelected={selectedLessonId === lesson.id}
                  onSelect={() => onSelectLesson(lesson)}
                />
              ))}
            </SortableContext>
          </DndContext>

          <button
            onClick={onAddLesson}
            className="w-full mt-2 p-2 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Shto Mesim
          </button>
        </div>
      )}
    </div>
  );
}

interface SortableLessonProps {
  lesson: Lesson;
  isSelected: boolean;
  onSelect: () => void;
}

function SortableLesson({ lesson, isSelected, onSelect }: SortableLessonProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = LESSON_ICONS[lesson.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
        isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50',
        isDragging && 'opacity-50'
      )}
      onClick={onSelect}
    >
      <button {...attributes} {...listeners} className="cursor-grab" onClick={(e) => e.stopPropagation()}>
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-sm text-foreground truncate">{lesson.title}</span>
      {lesson.duration && (
        <span className="text-xs text-muted-foreground">{Math.ceil(lesson.duration / 60)}min</span>
      )}
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          lesson.isPublished ? 'bg-green-500' : 'bg-slate-300'
        )}
      />
    </div>
  );
}

export default function CourseBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      const [courseRes, modulesRes, categoriesRes] = await Promise.all([
        coursesApi.getCourseById(courseId),
        coursesApi.getModules(courseId),
        categoriesApi.getAll(),
      ]);

      if (courseRes.data) {
        setCourse(courseRes.data);
      }

      if (modulesRes.data) {
        setModules(modulesRes.data);
        if (modulesRes.data.length > 0) {
          setExpandedModules(new Set([modulesRes.data[0].id]));
        }
      }
      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
    } catch (error) {
      console.error('Failed to load course:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCourseFn = useCallback(async (data: Partial<Course>): Promise<boolean> => {
    if (!course) return false;
    setIsSaving(true);
    try {
      await coursesApi.updateCourse(courseId, data);
      setCourse((prev) => prev ? { ...prev, ...data } : prev);
      return true;
    } catch (error) {
      console.error('Failed to save course:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [course, courseId]);

  const saveLessonFn = useCallback(async (data: Partial<Lesson>): Promise<boolean> => {
    if (!selectedLesson) return false;
    setIsSaving(true);
    try {
      await coursesApi.updateLesson(courseId, selectedLesson.moduleId, selectedLesson.id, data);
      setModules((prev) =>
        prev.map((m) =>
          m.id === selectedLesson.moduleId
            ? {
                ...m,
                lessons: m.lessons.map((l) =>
                  l.id === selectedLesson.id ? { ...l, ...data } : l
                ),
              }
            : m
        )
      );
      setSelectedLesson((prev) => prev ? { ...prev, ...data } : prev);
      return true;
    } catch (error) {
      console.error('Failed to save lesson:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [selectedLesson, courseId]);

  const handleModuleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);

    const newModules = [...modules];
    const [removed] = newModules.splice(oldIndex, 1);
    newModules.splice(newIndex, 0, removed);

    const reordered = newModules.map((m, i) => ({ ...m, orderIndex: i }));
    setModules(reordered);

    await coursesApi.reorderModules(
      courseId,
      reordered.map((m) => ({ id: m.id, orderIndex: m.orderIndex }))
    );
  };

  const handleLessonsReorder = async (moduleId: string, lessons: Lesson[]) => {
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, lessons } : m))
    );

    await coursesApi.reorderLessons(
      courseId,
      moduleId,
      lessons.map((l) => ({ id: l.id, orderIndex: l.orderIndex }))
    );
  };

  const handleAddModule = async () => {
    try {
      const res = await coursesApi.createModule(courseId, {
        title: `Modul ${modules.length + 1}`,
      });
      if (res.data) {
        const newModule = { ...res.data, lessons: [] };
        setModules((prev) => [...prev, newModule]);
        setExpandedModules((prev) => new Set([...Array.from(prev), newModule.id]));
      }
    } catch (error) {
      console.error('Failed to create module:', error);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Jeni te sigurt qe deshironi te fshini kete modul?')) return;
    try {
      await coursesApi.deleteModule(courseId, moduleId);
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
    } catch (error) {
      console.error('Failed to delete module:', error);
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return;

    try {
      const res = await coursesApi.createLesson(courseId, moduleId, {
        title: `Mesim ${module.lessons.length + 1}`,
        type: 'TEXT',
      });
      if (res.data) {
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId ? { ...m, lessons: [...m.lessons, res.data!] } : m
          )
        );
        setSelectedLesson(res.data);
      }
    } catch (error) {
      console.error('Failed to create lesson:', error);
    }
  };

  const handleDeleteLesson = async () => {
    if (!selectedLesson) return;
    if (!confirm('Jeni te sigurt qe deshironi te fshini kete mesim?')) return;

    try {
      await coursesApi.deleteLesson(courseId, selectedLesson.moduleId, selectedLesson.id);
      setModules((prev) =>
        prev.map((m) =>
          m.id === selectedLesson.moduleId
            ? { ...m, lessons: m.lessons.filter((l) => l.id !== selectedLesson.id) }
            : m
        )
      );
      setSelectedLesson(null);
    } catch (error) {
      console.error('Failed to delete lesson:', error);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      await coursesApi.updateCourseStatus(courseId, 'PENDING_REVIEW');
      setCourse((prev) => prev ? { ...prev, status: 'PENDING_REVIEW' } : prev);
    } catch (error) {
      console.error('Failed to submit for review:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Kursi nuk u gjet ose nuk keni akses</p>
          <Button onClick={() => router.push('/instructor/courses')}>Kthehu te Kurset</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/instructor/courses')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kurset
            </Button>
            <div className="h-6 w-px bg-muted" />
            <h1 className="font-semibold text-foreground">{course?.title || 'Kurs i Ri'}</h1>
            {course && (
              <Badge variant={STATUS_BADGES[course.status].variant}>
                {STATUS_BADGES[course.status].label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isSaving && (
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Duke ruajtur...
              </span>
            )}
            {course?.status === 'DRAFT' && (
              <Button onClick={handleSubmitForReview}>
                Dergo per Aprovim
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Left Panel - Modules & Lessons */}
        <div className="w-[60%] p-6 border-r border-border min-h-[calc(100vh-57px)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Permbajtja e Kursit</h2>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
            <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {modules.map((module) => (
                  <SortableModule
                    key={module.id}
                    module={module}
                    courseId={courseId}
                    isExpanded={expandedModules.has(module.id)}
                    onToggle={() => {
                      setExpandedModules((prev) => {
                        const next = new Set(prev);
                        if (next.has(module.id)) {
                          next.delete(module.id);
                        } else {
                          next.add(module.id);
                        }
                        return next;
                      });
                    }}
                    onSelectLesson={setSelectedLesson}
                    selectedLessonId={selectedLesson?.id}
                    onAddLesson={() => handleAddLesson(module.id)}
                    onDeleteModule={() => handleDeleteModule(module.id)}
                    onLessonsReorder={handleLessonsReorder}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button variant="outline" className="w-full mt-4" onClick={handleAddModule}>
            <Plus className="h-4 w-4 mr-2" />
            Shto Modul
          </Button>
        </div>

        {/* Right Panel - Settings or Lesson Editor */}
        <div className="w-[40%] p-6 min-h-[calc(100vh-57px)] bg-card">
          {selectedLesson ? (
            <LessonEditor
              key={selectedLesson.id}
              lesson={selectedLesson}
              siblingLessons={modules
                .flatMap((m) => m.lessons)
                .filter((l) => l.id !== selectedLesson.id && (!!l.content || !!l.pdfUrl))
                .map((l) => ({ id: l.id, title: l.title, content: l.content, pdfUrl: l.pdfUrl }))}
              onSave={saveLessonFn}
              onDelete={handleDeleteLesson}
              onClose={() => setSelectedLesson(null)}
            />
          ) : (
            <CourseSettings
              course={course}
              categories={categories}
              onSave={saveCourseFn}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface LessonEditorProps {
  lesson: Lesson;
  /** other lessons in the course (text or PDF) usable as quiz sources */
  siblingLessons: { id: string; title: string; content?: string; pdfUrl?: string | null }[];
  /** persists the whole edited lesson; resolves true on success */
  onSave: (data: Partial<Lesson>) => Promise<boolean>;
  onDelete: () => void;
  onClose: () => void;
}

function detectVideoType(url: string): 'YOUTUBE' | 'VIMEO' | null {
  if (/(?:youtube\.com|youtu\.be)/i.test(url)) return 'YOUTUBE';
  if (/vimeo\.com/i.test(url)) return 'VIMEO';
  return null;
}

// Fields the editor owns; used for both the draft and dirty comparison.
type LessonDraft = Pick<
  Lesson,
  'title' | 'type' | 'content' | 'videoUrl' | 'videoType' | 'duration' | 'pdfUrl' | 'isPreview' | 'isPublished'
>;

function toDraft(lesson: Lesson): LessonDraft {
  return {
    title: lesson.title,
    type: lesson.type,
    content: lesson.content,
    videoUrl: lesson.videoUrl,
    videoType: lesson.videoType ?? null,
    duration: lesson.duration,
    pdfUrl: lesson.pdfUrl ?? null,
    isPreview: lesson.isPreview,
    isPublished: lesson.isPublished,
  };
}

function LessonEditor({ lesson, siblingLessons, onSave, onDelete, onClose }: LessonEditorProps) {
  const [isQuizGeneratorOpen, setIsQuizGeneratorOpen] = useState(false);
  const [existingQuiz, setExistingQuiz] = useState<QuizWithQuestions | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);
  const [isAssignmentEditorOpen, setIsAssignmentEditorOpen] = useState(false);
  const [hasAssignment, setHasAssignment] = useState(false);

  // Local working copy — nothing is persisted until "Ruaj" is pressed.
  const [draft, setDraft] = useState<LessonDraft>(() => toDraft(lesson));
  const [isSaving, setIsSaving] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(lesson));

  const update = (patch: Partial<LessonDraft>) => setDraft((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(draft);
    } finally {
      setIsSaving(false);
    }
  };

  // Video source: link (YouTube/Vimeo) vs uploaded file
  const [videoMode, setVideoMode] = useState<'link' | 'upload'>(
    lesson.videoType === 'UPLOAD' ? 'upload' : 'link'
  );
  // Text lesson: written content vs uploaded PDF
  const [textMode, setTextMode] = useState<'text' | 'pdf'>(lesson.pdfUrl ? 'pdf' : 'text');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (lesson.type === 'QUIZ') {
      loadExistingQuiz();
    } else if (lesson.type === 'ASSIGNMENT') {
      assignmentsApi
        .getForEdit(lesson.id)
        .then((res) => setHasAssignment(!!res.data))
        .catch(() => setHasAssignment(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const handleVideoUpload = async (file: File) => {
    setUploadError('');
    if (file.size > VIDEO_MAX_BYTES) {
      setUploadError('Skedari kalon limitin prej 50MB');
      return;
    }
    setIsUploading(true);
    try {
      const res = await uploadsApi.upload(file);
      if (res.data) {
        update({ videoUrl: res.data.url, videoType: 'UPLOAD' });
      }
    } catch {
      setUploadError('Ngarkimi i videos deshtoi');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    setUploadError('');
    if (file.size > PDF_MAX_BYTES) {
      setUploadError('Skedari kalon limitin prej 10MB');
      return;
    }
    setIsUploading(true);
    try {
      const res = await uploadsApi.upload(file);
      if (res.data) {
        update({ pdfUrl: res.data.url });
      }
    } catch {
      setUploadError('Ngarkimi i PDF-se deshtoi');
    } finally {
      setIsUploading(false);
    }
  };

  const loadExistingQuiz = async () => {
    setIsLoadingQuiz(true);
    try {
      const res = await quizzesApi.getQuizForEdit(lesson.id);
      setExistingQuiz(res.data ?? null);
    } catch (error) {
      console.error('Failed to load quiz:', error);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleQuizCreated = (quizId: string) => {
    loadExistingQuiz();
  };

  const handleDeleteQuiz = async () => {
    if (!existingQuiz) return;
    if (!confirm('Jeni te sigurt qe deshironi te fshini kete kuiz?')) return;

    setIsDeletingQuiz(true);
    try {
      await quizzesApi.deleteQuiz(existingQuiz.id);
      setExistingQuiz(null);
    } catch (error) {
      console.error('Failed to delete quiz:', error);
    } finally {
      setIsDeletingQuiz(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Edito Mesimin</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Mbyll
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Titulli</Label>
          <Input
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Tipi i Mesimit</Label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'VIDEO', label: 'Video', icon: Video },
              { value: 'TEXT', label: 'Tekst / PDF', icon: FileText },
              { value: 'QUIZ', label: 'Kuiz', icon: HelpCircle },
              { value: 'ASSIGNMENT', label: 'Detyre', icon: ClipboardList },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => update({ type: value })}
                className={cn(
                  'flex items-center gap-2 rounded-lg border p-3 transition-colors',
                  draft.type === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-input'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {draft.type === 'VIDEO' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setVideoMode('link')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-colors',
                  videoMode === 'link'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-input'
                )}
              >
                <Link2 className="h-4 w-4" />
                Lidhje
              </button>
              <button
                onClick={() => setVideoMode('upload')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-colors',
                  videoMode === 'upload'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-input'
                )}
              >
                <Upload className="h-4 w-4" />
                Ngarko skedar
              </button>
            </div>

            {videoMode === 'link' ? (
              <div className="space-y-2">
                <Label>URL e Videos (YouTube ose Vimeo)</Label>
                <Input
                  value={draft.videoType === 'UPLOAD' ? '' : draft.videoUrl || ''}
                  onChange={(e) =>
                    update({
                      videoUrl: e.target.value,
                      videoType: detectVideoType(e.target.value),
                    })
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Ngarko skedar video</Label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/40">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="mt-2 text-sm text-muted-foreground">Duke ngarkuar...</span>
                    </>
                  ) : draft.videoType === 'UPLOAD' && draft.videoUrl ? (
                    <>
                      <Video className="h-6 w-6 text-success" />
                      <span className="mt-2 text-sm font-medium text-foreground">Video u ngarkua</span>
                      <span className="text-xs text-muted-foreground">Kliko per ta zevendesuar</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="mt-2 text-sm text-muted-foreground">Kliko per te ngarkuar video</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVideoUpload(file);
                    }}
                  />
                </label>
                <p className="text-xs text-muted-foreground">Madhesia maksimale: 50MB</p>
              </div>
            )}

            {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}

            {draft.videoUrl && (
              <div className="space-y-2">
                <Label>Parapamje</Label>
                <VideoPlayer
                  videoUrl={draft.videoUrl}
                  videoType={draft.videoType}
                  lessonId={lesson.id}
                  onComplete={() => {}}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Kohezgjatja (sekonda)</Label>
              <Input
                type="number"
                min={0}
                max={86400}
                step={1}
                value={draft.duration || 0}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  update({ duration: Number.isNaN(n) ? 0 : Math.max(0, Math.min(86400, n)) });
                }}
              />
            </div>
          </div>
        )}

        {draft.type === 'TEXT' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setTextMode('text')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-colors',
                  textMode === 'text'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-input'
                )}
              >
                <FileText className="h-4 w-4" />
                Shkruaj tekst
              </button>
              <button
                onClick={() => setTextMode('pdf')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-colors',
                  textMode === 'pdf'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-input'
                )}
              >
                <Upload className="h-4 w-4" />
                Ngarko PDF
              </button>
            </div>

            {textMode === 'text' ? (
              <div className="space-y-2">
                <Label>Permbajtja</Label>
                <RichTextEditor
                  content={draft.content || ''}
                  onChange={(content) => update({ content })}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Skedar PDF</Label>
                {draft.pdfUrl ? (
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm text-foreground">PDF i ngarkuar</span>
                    </div>
                    <button
                      onClick={() => update({ pdfUrl: null })}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/40">
                    {isUploading ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="mt-2 text-sm text-muted-foreground">Duke ngarkuar...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="mt-2 text-sm text-muted-foreground">Kliko per te ngarkuar PDF</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePdfUpload(file);
                      }}
                    />
                  </label>
                )}
                <p className="text-xs text-muted-foreground">Madhesia maksimale: 10MB</p>
              </div>
            )}

            {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
          </div>
        )}

        {draft.type === 'QUIZ' && (
          <div className="space-y-4">
            {isLoadingQuiz ? (
              <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Duke ngarkuar kuizin...
              </div>
            ) : existingQuiz ? (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="p-4 bg-muted/50 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">{existingQuiz.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {existingQuiz.questions.length} pyetje • {existingQuiz.passingScore}% per te kaluar
                      </p>
                    </div>
                    {existingQuiz.isAiGenerated && (
                      <Badge variant="secondary" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {existingQuiz.questions.slice(0, 3).map((q, i) => (
                    <div key={q.id} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-muted-foreground">{i + 1}.</span>
                      <span className="line-clamp-1">{q.questionText}</span>
                    </div>
                  ))}
                  {existingQuiz.questions.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      + {existingQuiz.questions.length - 3} pyetje te tjera
                    </p>
                  )}
                </div>
                <div className="p-3 border-t border-border flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setIsQuizGeneratorOpen(true)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Rigjenero
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteQuiz}
                    disabled={isDeletingQuiz}
                  >
                    {isDeletingQuiz ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-border rounded-lg text-center">
                <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
                <h4 className="font-medium text-foreground mb-1">Gjenero Kuiz me AI</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Krijoni automatikisht pyetje nga permbajtja e mesimit
                </p>
                <Button onClick={() => setIsQuizGeneratorOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gjenero me AI
                </Button>
              </div>
            )}

            <AIQuizGenerator
              lessonId={lesson.id}
              lessonTitle={draft.title}
              lessonContent={draft.content || undefined}
              siblingLessons={siblingLessons}
              existingQuizId={existingQuiz?.id}
              isOpen={isQuizGeneratorOpen}
              onClose={() => setIsQuizGeneratorOpen(false)}
              onQuizCreated={handleQuizCreated}
            />
          </div>
        )}

        {draft.type === 'ASSIGNMENT' && (
          <div className="space-y-4">
            {hasAssignment ? (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ClipboardList className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-medium text-foreground">Detyra eshte konfiguruar</h4>
                      <p className="text-sm text-muted-foreground">Studentet mund ta dorezojne kete detyre.</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsAssignmentEditorOpen(true)}>
                    Menaxho
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                <ClipboardList className="mx-auto mb-3 h-8 w-8 text-primary" />
                <h4 className="mb-1 font-medium text-foreground">Krijo nje Detyre</h4>
                <p className="mb-4 text-sm text-muted-foreground">
                  Shto udhezime, afat dhe pike per kete mesim.
                </p>
                <Button onClick={() => setIsAssignmentEditorOpen(true)}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Konfiguro Detyren
                </Button>
              </div>
            )}

            <AssignmentEditor
              lessonId={lesson.id}
              lessonTitle={draft.title}
              isOpen={isAssignmentEditorOpen}
              onClose={() => setIsAssignmentEditorOpen(false)}
              onSaved={(a) => setHasAssignment(!!a)}
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isPreview}
              onChange={(e) => update({ isPreview: e.target.checked })}
              className="rounded border-input text-primary focus:ring-ring"
            />
            <span className="text-sm text-foreground">Preview i lire</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isPublished}
              onChange={(e) => update({ isPublished: e.target.checked })}
              className="rounded border-input text-primary focus:ring-ring"
            />
            <span className="text-sm text-foreground">Publikuar</span>
          </label>
        </div>

        {/* Save bar — sticks to the bottom of the editor panel */}
        <div className="sticky bottom-0 -mx-6 mt-2 border-t border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <Button className="flex-1" onClick={handleSave} disabled={!dirty || isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {dirty ? 'Ruaj Ndryshimet' : 'Te Gjitha te Ruajtura'}
            </Button>
          </div>
          {dirty && (
            <p className="mt-2 text-center text-xs text-warning">
              Keni ndryshime te paruajtura
            </p>
          )}
        </div>

        <Button variant="destructive" className="w-full" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          Fshi Mesimin
        </Button>
      </div>
    </div>
  );
}

interface CourseSettingsProps {
  course: Course | null;
  categories: Category[];
  onSave: (data: Partial<Course>) => Promise<boolean>;
}

type CourseDraft = Pick<
  Course,
  'title' | 'description' | 'categoryId' | 'level' | 'price' | 'thumbnailUrl'
>;

function toCourseDraft(course: Course): CourseDraft {
  return {
    title: course.title,
    description: course.description,
    categoryId: course.categoryId,
    level: course.level,
    price: course.price,
    thumbnailUrl: course.thumbnailUrl,
  };
}

function CourseSettings({ course, categories, onSave }: CourseSettingsProps) {
  const [draft, setDraft] = useState<CourseDraft | null>(course ? toCourseDraft(course) : null);
  const [isSaving, setIsSaving] = useState(false);

  // Re-sync when the course finishes loading or changes identity.
  useEffect(() => {
    setDraft(course ? toCourseDraft(course) : null);
  }, [course?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!course || !draft) return null;

  const update = (patch: Partial<CourseDraft>) =>
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  const dirty = JSON.stringify(draft) !== JSON.stringify(toCourseDraft(course));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(draft);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Konfigurimet e Kursit</h2>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Titulli</Label>
          <Input
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Pershkrimi</Label>
          <textarea
            value={draft.description}
            onChange={(e) => update({ description: e.target.value })}
            rows={4}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>

        <div className="space-y-2">
          <Label>Kategoria</Label>
          <select
            value={draft.categoryId || ''}
            onChange={(e) => update({ categoryId: e.target.value || undefined })}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">Zgjidh Kategorine</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Niveli</Label>
          <select
            value={draft.level}
            onChange={(e) => update({ level: e.target.value as Course['level'] })}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="BEGINNER">Fillestar</option>
            <option value="INTERMEDIATE">Mesatar</option>
            <option value="ADVANCED">Avancuar</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Cmimi (EUR)</Label>
          <Input
            type="number"
            value={draft.price}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              update({ price: Number.isNaN(n) ? 0 : Math.max(0, Math.min(100000, n)) });
            }}
            min={0}
            max={100000}
            step={0.01}
          />
        </div>

        <div className="space-y-2">
          <Label>Thumbnail URL</Label>
          <Input
            value={draft.thumbnailUrl || ''}
            onChange={(e) => update({ thumbnailUrl: e.target.value || undefined })}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="sticky bottom-0 -mx-6 border-t border-border bg-card px-6 py-4">
        <Button className="w-full" onClick={handleSave} disabled={!dirty || isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {dirty ? 'Ruaj Ndryshimet' : 'Te Gjitha te Ruajtura'}
        </Button>
        {dirty && (
          <p className="mt-2 text-center text-xs text-warning">
            Keni ndryshime te paruajtura
          </p>
        )}
      </div>
    </div>
  );
}

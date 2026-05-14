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
  Save,
  ArrowLeft,
  Loader2,
  Sparkles,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { coursesApi, categoriesApi, type Course, type Module, type Lesson, type Category } from '@/lib/api/courses';
import { quizzesApi, type QuizWithQuestions } from '@/lib/api/quizzes';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { AIQuizGenerator } from '@/components/instructor/AIQuizGenerator';
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
        'bg-white rounded-lg border border-slate-200 overflow-hidden',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-2 p-3 bg-slate-50 border-b border-slate-200">
        <button {...attributes} {...listeners} className="cursor-grab hover:text-indigo-600">
          <GripVertical className="h-5 w-5 text-slate-400" />
        </button>
        <button onClick={onToggle} className="flex-1 flex items-center gap-2 text-left">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500" />
          )}
          <span className="font-medium text-slate-900">{module.title}</span>
          <span className="text-sm text-slate-500">({module.lessons.length} mesime)</span>
        </button>
        <button
          onClick={onDeleteModule}
          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
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
            className="w-full mt-2 p-2 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
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
        isSelected ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50',
        isDragging && 'opacity-50'
      )}
      onClick={onSelect}
    >
      <button {...attributes} {...listeners} className="cursor-grab" onClick={(e) => e.stopPropagation()}>
        <GripVertical className="h-4 w-4 text-slate-400" />
      </button>
      <Icon className="h-4 w-4 text-slate-500" />
      <span className="flex-1 text-sm text-slate-700 truncate">{lesson.title}</span>
      {lesson.duration && (
        <span className="text-xs text-slate-400">{Math.ceil(lesson.duration / 60)}min</span>
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
      const [modulesRes, categoriesRes] = await Promise.all([
        coursesApi.getModules(courseId),
        categoriesApi.getAll(),
      ]);

      // Set a default course structure - will be loaded properly when we have the endpoint
      setCourse({
        id: courseId,
        title: 'Kurs',
        description: '',
        slug: '',
        level: 'BEGINNER',
        status: 'DRAFT',
        price: 0,
        totalDuration: 0,
        enrollmentCount: 0,
        instructorId: '',
        createdAt: '',
        updatedAt: '',
      });

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

  const saveCourseFn = useCallback(async (data: Partial<Course>) => {
    if (!course) return;
    setIsSaving(true);
    try {
      await coursesApi.updateCourse(courseId, data);
      setCourse((prev) => prev ? { ...prev, ...data } : prev);
    } catch (error) {
      console.error('Failed to save course:', error);
    } finally {
      setIsSaving(false);
    }
  }, [course, courseId]);

  const saveCourse = useDebounce(saveCourseFn, 1500);

  const saveLessonFn = useCallback(async (data: Partial<Lesson>) => {
    if (!selectedLesson) return;
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
    } catch (error) {
      console.error('Failed to save lesson:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedLesson, courseId]);

  const saveLesson = useDebounce(saveLessonFn, 1500);

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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/instructor/courses')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kurset
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <h1 className="font-semibold text-slate-900">{course?.title || 'Kurs i Ri'}</h1>
            {course && (
              <Badge variant={STATUS_BADGES[course.status].variant}>
                {STATUS_BADGES[course.status].label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isSaving && (
              <span className="text-sm text-slate-500 flex items-center gap-2">
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
        <div className="w-[60%] p-6 border-r border-slate-200 min-h-[calc(100vh-57px)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Permbajtja e Kursit</h2>
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
        <div className="w-[40%] p-6 min-h-[calc(100vh-57px)] bg-white">
          {selectedLesson ? (
            <LessonEditor
              lesson={selectedLesson}
              onUpdate={saveLesson}
              onDelete={handleDeleteLesson}
              onClose={() => setSelectedLesson(null)}
            />
          ) : (
            <CourseSettings
              course={course}
              categories={categories}
              onUpdate={saveCourse}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface LessonEditorProps {
  lesson: Lesson;
  onUpdate: (data: Partial<Lesson>) => void;
  onDelete: () => void;
  onClose: () => void;
}

function LessonEditor({ lesson, onUpdate, onDelete, onClose }: LessonEditorProps) {
  const [isQuizGeneratorOpen, setIsQuizGeneratorOpen] = useState(false);
  const [existingQuiz, setExistingQuiz] = useState<QuizWithQuestions | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);

  useEffect(() => {
    if (lesson.type === 'QUIZ') {
      loadExistingQuiz();
    }
  }, [lesson.id, lesson.type]);

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
        <h2 className="text-lg font-semibold text-slate-900">Edito Mesimin</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Mbyll
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Titulli</Label>
          <Input
            value={lesson.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Tipi i Mesimit</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['TEXT', 'VIDEO', 'QUIZ', 'ASSIGNMENT'] as const).map((type) => {
              const Icon = LESSON_ICONS[type];
              return (
                <button
                  key={type}
                  onClick={() => onUpdate({ type })}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border transition-colors',
                    lesson.type === type
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {lesson.type === 'VIDEO' && (
          <>
            <div className="space-y-2">
              <Label>URL e Videos</Label>
              <Input
                value={lesson.videoUrl || ''}
                onChange={(e) => onUpdate({ videoUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Kohezgjatja (sekonda)</Label>
              <Input
                type="number"
                value={lesson.duration || 0}
                onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 0 })}
              />
            </div>
          </>
        )}

        {lesson.type === 'TEXT' && (
          <div className="space-y-2">
            <Label>Permbajtja</Label>
            <RichTextEditor
              content={lesson.content || ''}
              onChange={(content) => onUpdate({ content })}
            />
          </div>
        )}

        {lesson.type === 'QUIZ' && (
          <div className="space-y-4">
            {isLoadingQuiz ? (
              <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-center gap-2 text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Duke ngarkuar kuizin...
              </div>
            ) : existingQuiz ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900">{existingQuiz.title}</h4>
                      <p className="text-sm text-slate-500">
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
                    <div key={q.id} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-slate-400">{i + 1}.</span>
                      <span className="line-clamp-1">{q.questionText}</span>
                    </div>
                  ))}
                  {existingQuiz.questions.length > 3 && (
                    <p className="text-sm text-slate-400">
                      + {existingQuiz.questions.length - 3} pyetje te tjera
                    </p>
                  )}
                </div>
                <div className="p-3 border-t border-slate-200 flex gap-2">
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
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg text-center">
                <Sparkles className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
                <h4 className="font-medium text-slate-900 mb-1">Gjenero Kuiz me AI</h4>
                <p className="text-sm text-slate-500 mb-4">
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
              lessonTitle={lesson.title}
              lessonContent={lesson.content || undefined}
              isOpen={isQuizGeneratorOpen}
              onClose={() => setIsQuizGeneratorOpen(false)}
              onQuizCreated={handleQuizCreated}
            />
          </div>
        )}

        {lesson.type === 'ASSIGNMENT' && (
          <div className="p-4 bg-slate-50 rounded-lg text-center text-sm text-slate-600">
            Detyre Builder do te jete i disponueshem se shpejti.
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lesson.isPreview}
              onChange={(e) => onUpdate({ isPreview: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">Preview i lire</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lesson.isPublished}
              onChange={(e) => onUpdate({ isPublished: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">Publikuar</span>
          </label>
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
  onUpdate: (data: Partial<Course>) => void;
}

function CourseSettings({ course, categories, onUpdate }: CourseSettingsProps) {
  if (!course) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Konfigurimet e Kursit</h2>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Titulli</Label>
          <Input
            value={course.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Pershkrimi</Label>
          <textarea
            value={course.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={4}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          />
        </div>

        <div className="space-y-2">
          <Label>Kategoria</Label>
          <select
            value={course.categoryId || ''}
            onChange={(e) => onUpdate({ categoryId: e.target.value || undefined })}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
            value={course.level}
            onChange={(e) => onUpdate({ level: e.target.value as Course['level'] })}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
            value={course.price}
            onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
            min={0}
            step={0.01}
          />
        </div>

        <div className="space-y-2">
          <Label>Thumbnail URL</Label>
          <Input
            value={course.thumbnailUrl || ''}
            onChange={(e) => onUpdate({ thumbnailUrl: e.target.value || undefined })}
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  );
}

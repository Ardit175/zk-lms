'use client';

import { ChevronDown, ChevronRight, Check, Lock, PlayCircle, FileText, HelpCircle, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT';
  duration: number | null;
  orderIndex: number;
  isCompleted: boolean;
  isLocked: boolean;
}

interface Module {
  id: string;
  title: string;
  orderIndex: number;
  completedLessons: number;
  totalLessons: number;
  lessons: Lesson[];
  isLocked: boolean;
}

interface CourseNavigationProps {
  modules: Module[];
  currentLessonId: string;
  onLessonClick: (lessonId: string) => void;
}

const LESSON_TYPE_ICONS = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
};

export function CourseNavigation({ modules, currentLessonId, onLessonClick }: CourseNavigationProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    const currentModule = modules.find((m) =>
      m.lessons.some((l) => l.id === currentLessonId)
    );
    return new Set(currentModule ? [currentModule.id] : [modules[0]?.id]);
  });

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  return (
    <nav className="h-full overflow-y-auto bg-white border-r border-slate-200">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Permbajtja e Kursit
        </h2>
        <div className="space-y-2">
          {modules.map((module) => (
            <ModuleItem
              key={module.id}
              module={module}
              isExpanded={expandedModules.has(module.id)}
              currentLessonId={currentLessonId}
              onToggle={() => toggleModule(module.id)}
              onLessonClick={onLessonClick}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

interface ModuleItemProps {
  module: Module;
  isExpanded: boolean;
  currentLessonId: string;
  onToggle: () => void;
  onLessonClick: (lessonId: string) => void;
}

function ModuleItem({ module, isExpanded, currentLessonId, onToggle, onLessonClick }: ModuleItemProps) {
  const isCompleted = module.completedLessons === module.totalLessons && module.totalLessons > 0;

  return (
    <div className="rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-2 p-3 text-left transition-colors',
          module.isLocked
            ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
            : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
        )}
        disabled={module.isLocked}
      >
        {module.isLocked ? (
          <Lock className="h-4 w-4 flex-shrink-0" />
        ) : isExpanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{module.title}</p>
          <p className="text-xs text-slate-500">
            {module.completedLessons}/{module.totalLessons} mesime
          </p>
        </div>
        {isCompleted && (
          <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </button>

      {isExpanded && !module.isLocked && (
        <div className="bg-white border-l-2 border-slate-100 ml-4">
          {module.lessons.map((lesson) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              isCurrent={lesson.id === currentLessonId}
              onClick={() => onLessonClick(lesson.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LessonItemProps {
  lesson: Lesson;
  isCurrent: boolean;
  onClick: () => void;
}

function LessonItem({ lesson, isCurrent, onClick }: LessonItemProps) {
  const Icon = LESSON_TYPE_ICONS[lesson.type];
  const canClick = !lesson.isLocked && (lesson.isCompleted || isCurrent || !lesson.isLocked);

  return (
    <button
      onClick={canClick ? onClick : undefined}
      disabled={lesson.isLocked}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
        isCurrent && 'bg-indigo-50 border-l-2 border-indigo-600 -ml-[2px]',
        !isCurrent && !lesson.isLocked && 'hover:bg-slate-50',
        lesson.isLocked && 'opacity-50 cursor-not-allowed'
      )}
      title={lesson.isLocked ? 'Perfundo mesimin e meparshem' : undefined}
    >
      {lesson.isCompleted ? (
        <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <Check className="h-3 w-3 text-white" />
        </div>
      ) : lesson.isLocked ? (
        <Lock className="h-5 w-5 text-slate-400 flex-shrink-0" />
      ) : (
        <Icon
          className={cn(
            'h-5 w-5 flex-shrink-0',
            isCurrent ? 'text-indigo-600' : 'text-slate-400'
          )}
        />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm truncate',
            isCurrent ? 'text-indigo-900 font-medium' : 'text-slate-700'
          )}
        >
          {lesson.title}
        </p>
        {lesson.duration && (
          <p className="text-xs text-slate-400">
            {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
          </p>
        )}
      </div>
    </button>
  );
}

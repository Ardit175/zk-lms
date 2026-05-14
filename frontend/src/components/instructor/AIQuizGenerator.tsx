'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Check,
  X,
  RotateCcw,
  Save,
  ChevronLeft,
} from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { aiApi, type GeneratedQuestion, type QuestionType, type Difficulty } from '@/lib/api/ai';
import { quizzesApi } from '@/lib/api/quizzes';
import { cn } from '@/lib/utils';

interface AIQuizGeneratorProps {
  lessonId: string;
  lessonTitle: string;
  lessonContent?: string;
  isOpen: boolean;
  onClose: () => void;
  onQuizCreated: (quizId: string) => void;
}

type Step = 'input' | 'review';

const LOADING_MESSAGES = [
  'Duke analizuar permbajtjen...',
  'Duke gjeneruar pyetjet...',
  'Duke perfunduar...',
];

export function AIQuizGenerator({
  lessonId,
  lessonTitle,
  lessonContent,
  isOpen,
  onClose,
  onQuizCreated,
}: AIQuizGeneratorProps) {
  const [step, setStep] = useState<Step>('input');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Input state
  const [sourceType, setSourceType] = useState<'lesson' | 'custom'>('lesson');
  const [customContent, setCustomContent] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(['MULTIPLE_CHOICE', 'TRUE_FALSE']);
  const [difficulty, setDifficulty] = useState<Difficulty>('INTERMEDIATE');

  // Quiz state
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  const handleGenerate = async () => {
    const content = sourceType === 'lesson' ? lessonContent : customContent;
    if (!content || content.length < 50) {
      alert('Permbajtja duhet te jete te pakten 50 karaktere');
      return;
    }

    setIsGenerating(true);
    setLoadingMessageIndex(0);

    try {
      const res = await aiApi.generateQuiz({
        content,
        numQuestions,
        questionTypes,
        difficulty,
        topic: lessonTitle,
      });

      if (res.data) {
        setQuizTitle(res.data.title);
        setQuestions(res.data.questions);
        setStep('review');
      }
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      alert('Gjenerimi i kuizit deshtoi. Provoni perseri.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (questions.length === 0) {
      alert('Shtoni te pakten nje pyetje');
      return;
    }

    setIsSaving(true);
    try {
      const res = await quizzesApi.createQuiz({
        lessonId,
        title: quizTitle || `Kuiz: ${lessonTitle}`,
        isAiGenerated: true,
        passingScore: 70,
        maxAttempts: 3,
        questions: questions.map((q, index) => ({
          questionText: q.questionText,
          type: q.type,
          orderIndex: index,
          points: q.points,
          explanation: q.explanation || undefined,
          options: q.options.map((opt) => ({
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
          })),
        })),
      });

      if (res.data) {
        onQuizCreated(res.data.id);
        onClose();
        resetState();
      }
    } catch (error) {
      console.error('Failed to save quiz:', error);
      alert('Ruajtja e kuizit deshtoi');
    } finally {
      setIsSaving(false);
    }
  };

  const resetState = () => {
    setStep('input');
    setQuestions([]);
    setQuizTitle('');
    setCustomContent('');
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  const toggleQuestionType = (type: QuestionType) => {
    setQuestionTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleQuestionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.questionText === active.id);
    const newIndex = questions.findIndex((q) => q.questionText === over.id);

    const newQuestions = [...questions];
    const [removed] = newQuestions.splice(oldIndex, 1);
    newQuestions.splice(newIndex, 0, removed);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index: number, data: Partial<GeneratedQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...data } : q))
    );
  };

  const deleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(
        'max-w-2xl',
        step === 'review' && 'max-w-4xl max-h-[90vh] overflow-y-auto'
      )}>
        {step === 'input' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                Gjenero Kuiz me AI
              </DialogTitle>
              <DialogDescription>
                Konfigurojni opsionet dhe AI do te gjeneroje pyetjet automatikisht.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Source Selector */}
              <div className="space-y-3">
                <Label>Burimi i Permbajtjes</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSourceType('lesson')}
                    className={cn(
                      'p-4 rounded-lg border-2 text-left transition-colors',
                      sourceType === 'lesson'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                    disabled={!lessonContent}
                  >
                    <p className="font-medium text-slate-900">Perdor permbajtjen e mesimit</p>
                    <p className="text-sm text-slate-500">
                      {lessonContent ? `${lessonContent.length} karaktere` : 'Pa permbajtje'}
                    </p>
                  </button>
                  <button
                    onClick={() => setSourceType('custom')}
                    className={cn(
                      'p-4 rounded-lg border-2 text-left transition-colors',
                      sourceType === 'custom'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <p className="font-medium text-slate-900">Shkruaj tekst tjeter</p>
                    <p className="text-sm text-slate-500">Ngjit permbajtje custom</p>
                  </button>
                </div>
                {sourceType === 'custom' && (
                  <textarea
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    placeholder="Ngjitni permbajtjen ketu..."
                    className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                )}
              </div>

              {/* Number of Questions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Numri i Pyetjeve</Label>
                  <span className="text-sm font-medium text-indigo-600">{numQuestions}</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={15}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Question Types */}
              <div className="space-y-3">
                <Label>Tipet e Pyetjeve</Label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: 'MULTIPLE_CHOICE', label: 'Me Zgjedhje' },
                    { value: 'TRUE_FALSE', label: 'E Vertete/Gabim' },
                    { value: 'SHORT_ANSWER', label: 'Pergjigje e Shkurter' },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => toggleQuestionType(value)}
                      className={cn(
                        'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                        questionTypes.includes(value)
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {questionTypes.includes(value) && <Check className="h-3 w-3 inline mr-1" />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-3">
                <Label>Veshtiresia</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'BEGINNER', label: 'Fillestar' },
                    { value: 'INTERMEDIATE', label: 'Mesatar' },
                    { value: 'ADVANCED', label: 'Avancuar' },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setDifficulty(value)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors border',
                        difficulty === value
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Anulo
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || (sourceType === 'custom' && customContent.length < 50)}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {LOADING_MESSAGES[loadingMessageIndex]}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gjenero Pyetjet
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setStep('input')}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <DialogTitle>Rishiko dhe Edito</DialogTitle>
                  <DialogDescription>
                    {questions.length} pyetje • {totalPoints} pike total
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Quiz Title */}
              <div className="space-y-2">
                <Label>Titulli i Kuizit</Label>
                <Input
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Shkruaj titullin e kuizit..."
                />
              </div>

              {/* Questions */}
              <DndContext collisionDetection={closestCenter} onDragEnd={handleQuestionDragEnd}>
                <SortableContext
                  items={questions.map((q) => q.questionText)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <SortableQuestionCard
                        key={question.questionText}
                        question={question}
                        index={index}
                        onUpdate={(data) => updateQuestion(index, data)}
                        onDelete={() => deleteQuestion(index)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('input')}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Rigjenero
                </Button>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Anulo
                </Button>
                <Button onClick={handleSaveQuiz} disabled={isSaving || questions.length === 0}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Ruaj Kuizin
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface SortableQuestionCardProps {
  question: GeneratedQuestion;
  index: number;
  onUpdate: (data: Partial<GeneratedQuestion>) => void;
  onDelete: () => void;
}

function SortableQuestionCard({ question, index, onUpdate, onDelete }: SortableQuestionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.questionText,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const updateOption = (optIndex: number, data: Partial<{ optionText: string; isCorrect: boolean }>) => {
    const newOptions = question.options.map((opt, i) => {
      if (i === optIndex) {
        return { ...opt, ...data };
      }
      if (data.isCorrect && question.type !== 'SHORT_ANSWER') {
        return { ...opt, isCorrect: false };
      }
      return opt;
    });
    onUpdate({ options: newOptions });
  };

  const addOption = () => {
    onUpdate({
      options: [...question.options, { optionText: '', isCorrect: false }],
    });
  };

  const removeOption = (optIndex: number) => {
    if (question.options.length <= 2) return;
    onUpdate({
      options: question.options.filter((_, i) => i !== optIndex),
    });
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn('transition-shadow', isDragging && 'shadow-lg opacity-90')}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <button
            {...attributes}
            {...listeners}
            className="mt-2 text-slate-400 hover:text-slate-600 cursor-grab"
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {index + 1}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {question.type === 'MULTIPLE_CHOICE' && 'Me Zgjedhje'}
                    {question.type === 'TRUE_FALSE' && 'E Vertete/Gabim'}
                    {question.type === 'SHORT_ANSWER' && 'Pergjigje e Shkurter'}
                  </Badge>
                  <span className="text-xs text-slate-500">{question.points} pike</span>
                </div>
                <textarea
                  value={question.questionText}
                  onChange={(e) => onUpdate({ questionText: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={2}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4 text-slate-400" />
              </Button>
            </div>

            {question.type !== 'SHORT_ANSWER' && (
              <div className="space-y-2">
                {question.options.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`q-${index}-correct`}
                      checked={option.isCorrect}
                      onChange={() => updateOption(optIndex, { isCorrect: true })}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <Input
                      value={option.optionText}
                      onChange={(e) => updateOption(optIndex, { optionText: e.target.value })}
                      className={cn(
                        'flex-1 text-sm',
                        option.isCorrect && 'border-green-300 bg-green-50'
                      )}
                    />
                    {question.options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(optIndex)}
                        className="h-8 w-8"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {question.type === 'MULTIPLE_CHOICE' && question.options.length < 6 && (
                  <Button variant="ghost" size="sm" onClick={addOption}>
                    <Plus className="h-3 w-3 mr-1" />
                    Shto opsion
                  </Button>
                )}
              </div>
            )}

            {question.explanation && (
              <div className="pt-2 border-t border-slate-100">
                <Label className="text-xs text-slate-500">Shpjegimi</Label>
                <textarea
                  value={question.explanation}
                  onChange={(e) => onUpdate({ explanation: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mt-1"
                  rows={2}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

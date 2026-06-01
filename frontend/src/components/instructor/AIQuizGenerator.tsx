'use client';

import { useState, useEffect, useRef } from 'react';
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
  FileText,
  PlaySquare,
  Upload,
  Mic,
  AlertTriangle,
  Layers,
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
import {
  aiApi,
  type GeneratedQuestion,
  type QuestionType,
  type Difficulty,
  type ExtractionResult,
} from '@/lib/api/ai';
import { quizzesApi } from '@/lib/api/quizzes';
import { resolveFileUrl } from '@/lib/fileUrl';
import { cn } from '@/lib/utils';

interface SiblingLesson {
  id: string;
  title: string;
  content?: string;
  pdfUrl?: string | null;
}

interface AIQuizGeneratorProps {
  lessonId: string;
  lessonTitle: string;
  lessonContent?: string;
  /** other lessons in the course that have text content */
  siblingLessons?: SiblingLesson[];
  /** when regenerating, the existing quiz is replaced (deleted) on save */
  existingQuizId?: string;
  isOpen: boolean;
  onClose: () => void;
  onQuizCreated: (quizId: string) => void;
}

type Step = 'input' | 'review';
type SourceType = 'lesson' | 'lessons' | 'custom' | 'pdf' | 'youtube' | 'audio';

const LOADING_MESSAGES = [
  'Duke analizuar permbajtjen...',
  'Duke gjeneruar pyetjet...',
  'Duke perfunduar...',
];

// Strips rich-text HTML to plain text so aggregated lesson content stays clean
// when fed to the quiz generator.
function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|div|h[1-6]|li|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const EXTRACT_MESSAGES: Record<Exclude<SourceType, 'lesson' | 'lessons' | 'custom'>, string[]> = {
  pdf: ['Duke lexuar PDF-ne...', 'Duke ekstraktuar tekstin...', 'Duke pastruar permbajtjen...'],
  youtube: ['Duke u lidhur me YouTube...', 'Duke marre transcript-in...', 'Duke perfunduar...'],
  audio: ['Duke ngarkuar ne Whisper...', 'Duke transkriptuar audion...', 'Mund te zgjase deri ne 1 minute...'],
};

export function AIQuizGenerator({
  lessonId,
  lessonTitle,
  lessonContent,
  siblingLessons = [],
  existingQuizId,
  isOpen,
  onClose,
  onQuizCreated,
}: AIQuizGeneratorProps) {
  const [step, setStep] = useState<Step>('input');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Input state
  const [sourceType, setSourceType] = useState<SourceType>('lesson');
  const [customContent, setCustomContent] = useState('');

  // "Previous lessons" source — selected lesson ids to aggregate as content
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);

  // PDF / Audio source state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // YouTube source state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeLanguage, setYoutubeLanguage] = useState('');

  // Extracted preview (PDF / YouTube / Audio after extraction)
  const [extracted, setExtracted] = useState<ExtractionResult | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Quiz options
  const [numQuestions, setNumQuestions] = useState(5);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(['MULTIPLE_CHOICE', 'TRUE_FALSE']);
  const [difficulty, setDifficulty] = useState<Difficulty>('INTERMEDIATE');

  // Quiz state
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);

  useEffect(() => {
    if (isGenerating || isExtracting) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isGenerating, isExtracting]);

  useEffect(() => {
    // Reset extracted preview when the user switches source type
    setExtracted(null);
    setExtractError(null);
  }, [sourceType]);

  const resolveContent = (): string | null => {
    if (sourceType === 'lesson') return lessonContent || null;
    if (sourceType === 'custom') return customContent;
    return extracted?.content || null;
  };

  // Aggregates the selected lessons' content. Text lessons are used directly;
  // PDF-only lessons are fetched and run through the AI PDF extractor.
  const buildLessonsContent = async (): Promise<string | null> => {
    const selected = siblingLessons.filter((l) => selectedLessonIds.includes(l.id));
    const parts: string[] = [];
    for (const l of selected) {
      const text = htmlToText(l.content || '');
      if (text.length > 0) {
        parts.push(`## ${l.title}\n${text}`);
      } else if (l.pdfUrl) {
        try {
          const resp = await fetch(resolveFileUrl(l.pdfUrl));
          const blob = await resp.blob();
          const file = new File([blob], `${l.title || 'lesson'}.pdf`, { type: 'application/pdf' });
          const ex = await aiApi.extractPdf(file);
          if (ex.data?.content) parts.push(`## ${l.title}\n${ex.data.content}`);
        } catch (err) {
          console.error('PDF extraction failed for lesson', l.id, err);
        }
      }
    }
    return parts.length ? parts.join('\n\n') : null;
  };

  const needsExtraction =
    sourceType === 'pdf' || sourceType === 'youtube' || sourceType === 'audio';

  const toggleLessonSelected = (id: string) => {
    setSelectedLessonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleExtract = async () => {
    setExtractError(null);
    setIsExtracting(true);
    setLoadingMessageIndex(0);
    try {
      let res;
      if (sourceType === 'pdf') {
        if (!pdfFile) throw new Error('Zgjidh nje skedar PDF');
        res = await aiApi.extractPdf(pdfFile);
      } else if (sourceType === 'youtube') {
        if (!youtubeUrl.trim()) throw new Error('Vendos URL-ne e YouTube');
        res = await aiApi.extractYoutube(youtubeUrl.trim(), youtubeLanguage || undefined);
      } else if (sourceType === 'audio') {
        if (!audioFile) throw new Error('Zgjidh nje skedar audio/video');
        res = await aiApi.extractAudio(audioFile, lessonTitle);
      } else {
        return;
      }
      if (res.data) {
        setExtracted(res.data);
      } else if (res.error) {
        setExtractError(res.error);
      }
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } }; message?: string })?.response?.data
          ?.error ||
        (err as { message?: string })?.message ||
        'Ekstrakti deshtoi';
      setExtractError(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setLoadingMessageIndex(0);

    try {
      const content =
        sourceType === 'lessons' ? await buildLessonsContent() : resolveContent();
      if (!content || content.length < 50) {
        alert('Permbajtja duhet te jete te pakten 50 karaktere');
        return;
      }

      const res = await aiApi.generateQuiz({
        content,
        numQuestions,
        questionTypes,
        difficulty,
        topic: extracted?.sourceLabel || lessonTitle,
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
      // Regeneration: a lesson can only hold one quiz, so replace the old one.
      if (existingQuizId) {
        await quizzesApi.deleteQuiz(existingQuizId);
      }
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
    setSelectedLessonIds([]);
    setPdfFile(null);
    setAudioFile(null);
    setYoutubeUrl('');
    setYoutubeLanguage('');
    setExtracted(null);
    setExtractError(null);
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
        'max-w-2xl max-h-[90vh] overflow-y-auto',
        step === 'review' && 'max-w-4xl'
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
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'lesson', label: 'Mesimi', icon: FileText, disabled: !lessonContent },
                    { value: 'lessons', label: 'Mesime te tjera', icon: Layers, disabled: siblingLessons.length === 0 },
                    { value: 'custom', label: 'Tekst', icon: FileText, disabled: false },
                    { value: 'pdf', label: 'PDF', icon: Upload, disabled: false },
                    { value: 'youtube', label: 'YouTube', icon: PlaySquare, disabled: false },
                    { value: 'audio', label: 'Audio/Video', icon: Mic, disabled: false },
                  ] as const).map(({ value, label, icon: Icon, disabled }) => (
                    <button
                      key={value}
                      onClick={() => setSourceType(value)}
                      disabled={disabled}
                      className={cn(
                        'p-3 rounded-lg border-2 text-center transition-colors flex flex-col items-center gap-1.5',
                        sourceType === value
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700',
                        disabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>

                {/* Per-source input panel */}
                {sourceType === 'lesson' && (
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600">
                    {lessonContent
                      ? `Permbajtja e mesimit "${lessonTitle}" do te perdoret (${lessonContent.length} karaktere).`
                      : 'Ky mesim s\'ka permbajtje teksti. Zgjidh nje burim tjeter.'}
                  </div>
                )}

                {sourceType === 'lessons' && (
                  <div className="space-y-2">
                    {siblingLessons.length === 0 ? (
                      <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600">
                        S&apos;ka mesime te tjera me permbajtje ne kete kurs.
                      </div>
                    ) : (
                      <>
                        <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                          {siblingLessons.map((l) => {
                            const textLen = htmlToText(l.content || '').length;
                            const isPdf = textLen === 0 && !!l.pdfUrl;
                            return (
                              <label
                                key={l.id}
                                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedLessonIds.includes(l.id)}
                                  onChange={() => toggleLessonSelected(l.id)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="flex-1 text-sm text-slate-700 truncate">{l.title}</span>
                                {isPdf ? (
                                  <Badge variant="secondary" className="gap-1 text-xs">
                                    <Upload className="h-3 w-3" />
                                    PDF
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-slate-400">{textLen} karaktere</span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                        <p className="text-xs text-slate-500">
                          Zgjidh nje ose me shume mesime; permbajtja e tyre kombinohet per gjenerimin.
                          Mesimet PDF ekstraktohen automatikisht.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {sourceType === 'custom' && (
                  <textarea
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    placeholder="Ngjitni permbajtjen ketu..."
                    className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                )}

                {sourceType === 'pdf' && (
                  <div className="space-y-2">
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        setPdfFile(e.target.files?.[0] || null);
                        setExtracted(null);
                        setExtractError(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className="w-full p-4 rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-500 text-center text-sm text-slate-600 transition-colors"
                    >
                      <Upload className="h-5 w-5 mx-auto mb-1 text-slate-400" />
                      {pdfFile ? (
                        <span className="font-medium text-slate-900">
                          {pdfFile.name} · {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      ) : (
                        <span>Kliko per te zgjedhur PDF (max 25MB)</span>
                      )}
                    </button>
                  </div>
                )}

                {sourceType === 'youtube' && (
                  <div className="space-y-2">
                    <Input
                      value={youtubeUrl}
                      onChange={(e) => {
                        setYoutubeUrl(e.target.value);
                        setExtracted(null);
                        setExtractError(null);
                      }}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <Input
                      value={youtubeLanguage}
                      onChange={(e) => setYoutubeLanguage(e.target.value)}
                      placeholder="Gjuha e preferuar (psh. 'en', 'sq') — opsionale"
                    />
                    <p className="text-xs text-slate-500">
                      Videoja duhet te kete captions (transcript). Per video pa caption, perdor opsionin &quot;Audio/Video&quot;.
                    </p>
                  </div>
                )}

                {sourceType === 'audio' && (
                  <div className="space-y-2">
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        setAudioFile(e.target.files?.[0] || null);
                        setExtracted(null);
                        setExtractError(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="w-full p-4 rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-500 text-center text-sm text-slate-600 transition-colors"
                    >
                      <Mic className="h-5 w-5 mx-auto mb-1 text-slate-400" />
                      {audioFile ? (
                        <span className="font-medium text-slate-900">
                          {audioFile.name} · {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      ) : (
                        <span>Kliko per audio/video (max 25MB · limit Whisper)</span>
                      )}
                    </button>
                    <p className="text-xs text-slate-500">
                      Transkriptohet me OpenAI Whisper. Tipet e mbeshtetura: mp3, mp4, m4a, wav, webm.
                    </p>
                  </div>
                )}

                {/* Extract action + preview (PDF / YouTube / Audio) */}
                {needsExtraction && (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant={extracted ? 'outline' : 'default'}
                      onClick={handleExtract}
                      disabled={
                        isExtracting ||
                        (sourceType === 'pdf' && !pdfFile) ||
                        (sourceType === 'youtube' && !youtubeUrl.trim()) ||
                        (sourceType === 'audio' && !audioFile)
                      }
                      className="w-full"
                    >
                      {isExtracting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {EXTRACT_MESSAGES[sourceType][loadingMessageIndex % 3]}
                        </>
                      ) : extracted ? (
                        <>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Ri-ekstrakto
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Ekstrakto Permbajtjen
                        </>
                      )}
                    </Button>

                    {extractError && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>{extractError}</span>
                      </div>
                    )}

                    {extracted && (
                      <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50 space-y-2">
                        <div className="flex items-center justify-between text-xs text-indigo-900">
                          <span className="font-medium">{extracted.sourceLabel}</span>
                          <span>
                            {extracted.charCount.toLocaleString()} karaktere
                            {extracted.truncated && ' · cunguar'}
                          </span>
                        </div>
                        <div className="max-h-32 overflow-y-auto text-xs text-slate-700 whitespace-pre-wrap bg-white p-2 rounded border border-indigo-100">
                          {extracted.content.slice(0, 800)}
                          {extracted.content.length > 800 && '…'}
                        </div>
                      </div>
                    )}
                  </div>
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
                disabled={
                  isGenerating ||
                  isExtracting ||
                  (sourceType === 'lesson' && (!lessonContent || lessonContent.length < 50)) ||
                  (sourceType === 'lessons' && selectedLessonIds.length === 0) ||
                  (sourceType === 'custom' && customContent.length < 50) ||
                  (needsExtraction && !extracted)
                }
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  RotateCcw,
  Trophy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CountUp } from '@/components/ui/count-up';
import { Confetti } from '@/components/ui/confetti';
import {
  quizzesApi,
  type QuizInfo,
  type QuizQuestion,
  type QuizAnswer,
  type QuizResult,
} from '@/lib/api/quizzes';
import { cn } from '@/lib/utils';

type QuizState = 'LOADING' | 'INTRO' | 'IN_PROGRESS' | 'REVIEWING' | 'COMPLETED';

interface QuizPlayerProps {
  quizId: string;
  onComplete: (passed: boolean) => void;
}

export function QuizPlayer({ quizId, onComplete }: QuizPlayerProps) {
  const [state, setState] = useState<QuizState>('LOADING');
  const [quizInfo, setQuizInfo] = useState<QuizInfo | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, QuizAnswer>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [results, setResults] = useState<{
    score: number;
    isPassed: boolean;
    passingScore: number;
    results: QuizResult[];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    loadQuizInfo();
  }, [quizId]);

  useEffect(() => {
    if (state !== 'IN_PROGRESS' || timeRemaining === null) return;

    if (timeRemaining <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [state, timeRemaining]);

  const loadQuizInfo = async () => {
    try {
      const res = await quizzesApi.getQuiz(quizId);
      if (res.data) {
        setQuizInfo(res.data);
        setState('INTRO');
      }
    } catch (error) {
      console.error('Failed to load quiz:', error);
    }
  };

  const handleStart = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      const res = await quizzesApi.startAttempt(quizId);
      if (res.data) {
        setAttemptId(res.data.attemptId);
        setQuestions(res.data.questions);
        setTimeRemaining(res.data.timeLimit);
        setCurrentIndex(0);
        setAnswers(new Map());
        setState('IN_PROGRESS');
      }
    } catch (error) {
      console.error('Failed to start quiz:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleAnswer = (questionId: string, answer: Partial<QuizAnswer>) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionId, { questionId, ...answer });
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!attemptId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const answersArray = Array.from(answers.values());
      const res = await quizzesApi.submitAttempt(attemptId, answersArray);
      if (res.data) {
        setResults({
          score: res.data.score,
          isPassed: res.data.isPassed,
          passingScore: res.data.passingScore,
          results: res.data.results,
        });
        setState('REVIEWING');
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setState('INTRO');
    loadQuizInfo();
  };

  const handleFinish = () => {
    setState('COMPLETED');
    onComplete(results?.isPassed || false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (state === 'LOADING') {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state === 'INTRO' && quizInfo) {
    return <IntroScreen quizInfo={quizInfo} onStart={handleStart} isStarting={isStarting} />;
  }

  if (state === 'IN_PROGRESS' && questions.length > 0) {
    const currentQuestion = questions[currentIndex];
    const currentAnswer = answers.get(currentQuestion.id);
    const isLastQuestion = currentIndex === questions.length - 1;
    const hasAnswer = currentAnswer?.selectedOptionId || currentAnswer?.textAnswer;

    return (
      <div className="bg-card rounded-lg shadow-sm">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Pyetja {currentIndex + 1} nga {questions.length}
          </div>
          {timeRemaining !== null && (
            <div
              className={cn(
                'flex items-center gap-2 font-mono text-sm font-medium',
                timeRemaining <= 30 ? 'text-destructive' : 'text-foreground'
              )}
            >
              <Clock className="h-4 w-4" />
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question Content — each question animates in as you advance */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <QuestionCard
                question={currentQuestion}
                answer={currentAnswer}
                onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-end gap-3">
          {isLastQuestion ? (
            <Button onClick={handleSubmit} disabled={!hasAnswer || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Duke derguar...
                </>
              ) : (
                'Perfundo Kuizin'
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIndex((i) => i + 1)}
              disabled={!hasAnswer}
            >
              Pyetja Tjeter
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (state === 'REVIEWING' && results) {
    return (
      <ReviewScreen
        results={results}
        attemptsRemaining={quizInfo?.attemptsRemaining ? quizInfo.attemptsRemaining - 1 : 0}
        onRetry={handleRetry}
        onFinish={handleFinish}
      />
    );
  }

  return null;
}

interface IntroScreenProps {
  quizInfo: QuizInfo;
  onStart: () => void;
  isStarting: boolean;
}

function IntroScreen({ quizInfo, onStart, isStarting }: IntroScreenProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mb-6">
          <AlertCircle className="h-8 w-8 text-primary" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">{quizInfo.title}</h2>
        {quizInfo.description && (
          <p className="text-muted-foreground mb-6">{quizInfo.description}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-2xl mx-auto">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-2xl font-bold text-foreground">{quizInfo.questionCount}</p>
            <p className="text-sm text-muted-foreground">Pyetje</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-2xl font-bold text-foreground">{quizInfo.passingScore}%</p>
            <p className="text-sm text-muted-foreground">Per te Kaluar</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-2xl font-bold text-foreground">
              {quizInfo.timeLimit ? `${Math.floor(quizInfo.timeLimit / 60)}min` : '∞'}
            </p>
            <p className="text-sm text-muted-foreground">Koha</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-2xl font-bold text-foreground">{quizInfo.attemptsRemaining}</p>
            <p className="text-sm text-muted-foreground">Tentativa</p>
          </div>
        </div>

        {quizInfo.attemptsRemaining > 0 ? (
          <Button size="lg" onClick={onStart} disabled={isStarting}>
            {isStarting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Fillo Kuizin
          </Button>
        ) : (
          <p className="text-destructive font-medium">
            Ke perdorur te gjitha tentativat per kete kuiz.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface QuestionCardProps {
  question: QuizQuestion;
  answer?: QuizAnswer;
  onAnswer: (answer: Partial<QuizAnswer>) => void;
}

function QuestionCard({ question, answer, onAnswer }: QuestionCardProps) {
  if (question.type === 'TRUE_FALSE') {
    return (
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-6">
          {question.questionText}
        </h3>
        <div className="flex gap-4 justify-center">
          {question.options.map((option) => {
            const selected = answer?.selectedOptionId === option.id;
            return (
              <button
                key={option.id}
                onClick={() => onAnswer({ selectedOptionId: option.id })}
                className={cn(
                  'press relative h-24 w-32 rounded-xl border-2 text-lg font-semibold transition-all',
                  selected
                    ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20'
                    : 'border-border text-foreground hover:border-primary/40 hover:bg-accent/50'
                )}
              >
                {option.optionText}
                {selected && <SelectedTick />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === 'SHORT_ANSWER') {
    return (
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-6">
          {question.questionText}
        </h3>
        <textarea
          value={answer?.textAnswer || ''}
          onChange={(e) => onAnswer({ textAnswer: e.target.value })}
          placeholder="Shkruaj pergjigjen tende ketu..."
          className="w-full h-32 p-4 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-6">
        {question.questionText}
      </h3>
      <div className="space-y-3">
        {question.options.map((option, i) => {
          const selected = answer?.selectedOptionId === option.id;
          return (
            <motion.button
              key={option.id}
              onClick={() => onAnswer({ selectedOptionId: option.id })}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.06 }}
              className={cn(
                'press flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all',
                selected
                  ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20'
                  : 'border-border hover:border-primary/40 hover:bg-accent/50'
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                )}
              >
                {selected && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
                    <Check className="h-4 w-4" />
                  </motion.span>
                )}
              </span>
              <span className={cn('font-medium', selected ? 'text-primary' : 'text-foreground')}>
                {option.optionText}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/** Animated tick badge for the True/False tiles. */
function SelectedTick() {
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
    >
      <Check className="h-3 w-3" />
    </motion.span>
  );
}

interface ReviewScreenProps {
  results: {
    score: number;
    isPassed: boolean;
    passingScore: number;
    results: QuizResult[];
  };
  attemptsRemaining: number;
  onRetry: () => void;
  onFinish: () => void;
}

function ReviewScreen({ results, attemptsRemaining, onRetry, onFinish }: ReviewScreenProps) {
  // Celebrate a pass — a bigger burst for a high score.
  const celebrate = results.isPassed;
  return (
    <div className="space-y-6">
      {celebrate && <Confetti count={results.score >= 90 ? 220 : 150} />}
      {/* Score Card */}
      <Card className="overflow-hidden border-gradient">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            className={cn(
              'mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full',
              results.isPassed ? 'bg-success/15' : 'bg-destructive/15'
            )}
          >
            {results.isPassed ? (
              <Trophy className="h-10 w-10 text-success" />
            ) : (
              <XCircle className="h-10 w-10 text-destructive" />
            )}
          </motion.div>

          <h2 className="font-display text-5xl font-bold tracking-tight text-foreground">
            <CountUp value={results.score} duration={1400} suffix="%" />
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={cn(
              'mb-4 mt-2 text-lg font-medium',
              results.isPassed ? 'text-success' : 'text-destructive'
            )}
          >
            {results.isPassed ? 'Urime! Kaluat kuizin!' : 'Nuk kaluat. Provoni perseri.'}
          </motion.p>
          <p className="text-sm text-muted-foreground">
            Nota kaluese: {results.passingScore}%
          </p>

          <div className="flex justify-center gap-4 mt-6">
            {results.isPassed ? (
              <Button onClick={onFinish}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Vazhdo me Mesimin Tjeter
              </Button>
            ) : (
              <>
                {attemptsRemaining > 0 && (
                  <Button variant="outline" onClick={onRetry}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Provo Perseri ({attemptsRemaining} tentativa)
                  </Button>
                )}
                <Button onClick={onFinish}>Vazhdo</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Breakdown */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Rishikimi i Pergjigjeve</h3>
          <div className="space-y-4">
            {results.results.map((result, index) => (
              <div
                key={result.questionId}
                className={cn(
                  'p-4 rounded-lg border',
                  result.isCorrect
                    ? 'border-success/30 bg-success/10'
                    : 'border-destructive/30 bg-destructive/10'
                )}
              >
                <div className="flex items-start gap-3">
                  {result.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-foreground mb-2">
                      {index + 1}. {result.questionText}
                    </p>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-muted-foreground">Pergjigja jote:</span>{' '}
                        <span
                          className={cn(
                            'font-medium',
                            result.isCorrect ? 'text-success' : 'text-destructive'
                          )}
                        >
                          {result.studentAnswer || '(Pa pergjigjur)'}
                        </span>
                      </p>
                      {!result.isCorrect && (
                        <p>
                          <span className="text-muted-foreground">Pergjigja e sakte:</span>{' '}
                          <span className="font-medium text-success">
                            {result.correctAnswer}
                          </span>
                        </p>
                      )}
                      {result.explanation && (
                        <p className="text-muted-foreground mt-2 p-2 bg-background/50 rounded">
                          <span className="font-medium">Shpjegim:</span> {result.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {result.pointsEarned}/{result.maxPoints}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

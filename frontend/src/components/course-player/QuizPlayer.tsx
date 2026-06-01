'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
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
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Pyetja {currentIndex + 1} nga {questions.length}
          </div>
          {timeRemaining !== null && (
            <div
              className={cn(
                'flex items-center gap-2 font-mono text-sm font-medium',
                timeRemaining <= 30 ? 'text-red-600' : 'text-slate-700'
              )}
            >
              <Clock className="h-4 w-4" />
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question Content */}
        <div className="p-6">
          <QuestionCard
            question={currentQuestion}
            answer={currentAnswer}
            onAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 flex justify-end gap-3">
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
        <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
          <AlertCircle className="h-8 w-8 text-indigo-600" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">{quizInfo.title}</h2>
        {quizInfo.description && (
          <p className="text-slate-500 mb-6">{quizInfo.description}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-2xl mx-auto">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-slate-900">{quizInfo.questionCount}</p>
            <p className="text-sm text-slate-500">Pyetje</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-slate-900">{quizInfo.passingScore}%</p>
            <p className="text-sm text-slate-500">Per te Kaluar</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-slate-900">
              {quizInfo.timeLimit ? `${Math.floor(quizInfo.timeLimit / 60)}min` : '∞'}
            </p>
            <p className="text-sm text-slate-500">Koha</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-slate-900">{quizInfo.attemptsRemaining}</p>
            <p className="text-sm text-slate-500">Tentativa</p>
          </div>
        </div>

        {quizInfo.attemptsRemaining > 0 ? (
          <Button size="lg" onClick={onStart} disabled={isStarting}>
            {isStarting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Fillo Kuizin
          </Button>
        ) : (
          <p className="text-red-600 font-medium">
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
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          {question.questionText}
        </h3>
        <div className="flex gap-4 justify-center">
          {question.options.map((option) => (
            <button
              key={option.id}
              onClick={() => onAnswer({ selectedOptionId: option.id })}
              className={cn(
                'w-32 h-24 rounded-lg border-2 text-lg font-semibold transition-all',
                answer?.selectedOptionId === option.id
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              )}
            >
              {option.optionText}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (question.type === 'SHORT_ANSWER') {
    return (
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          {question.questionText}
        </h3>
        <textarea
          value={answer?.textAnswer || ''}
          onChange={(e) => onAnswer({ textAnswer: e.target.value })}
          placeholder="Shkruaj pergjigjen tende ketu..."
          className="w-full h-32 p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900 mb-6">
        {question.questionText}
      </h3>
      <div className="space-y-3">
        {question.options.map((option) => (
          <button
            key={option.id}
            onClick={() => onAnswer({ selectedOptionId: option.id })}
            className={cn(
              'w-full p-4 rounded-lg border-2 text-left transition-all',
              answer?.selectedOptionId === option.id
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300'
            )}
          >
            <span
              className={cn(
                'font-medium',
                answer?.selectedOptionId === option.id
                  ? 'text-indigo-700'
                  : 'text-slate-700'
              )}
            >
              {option.optionText}
            </span>
          </button>
        ))}
      </div>
    </div>
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
  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card>
        <CardContent className="p-8 text-center">
          <div
            className={cn(
              'mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4',
              results.isPassed ? 'bg-green-100' : 'bg-red-100'
            )}
          >
            {results.isPassed ? (
              <Trophy className="h-10 w-10 text-green-600" />
            ) : (
              <XCircle className="h-10 w-10 text-red-600" />
            )}
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            {results.score}%
          </h2>
          <p
            className={cn(
              'text-lg font-medium mb-4',
              results.isPassed ? 'text-green-600' : 'text-red-600'
            )}
          >
            {results.isPassed ? 'Urime! Kaluat kuizin!' : 'Nuk kaluat. Provoni perseri.'}
          </p>
          <p className="text-sm text-slate-500">
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
          <h3 className="font-semibold text-slate-900 mb-4">Rishikimi i Pergjigjeve</h3>
          <div className="space-y-4">
            {results.results.map((result, index) => (
              <div
                key={result.questionId}
                className={cn(
                  'p-4 rounded-lg border',
                  result.isCorrect
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                )}
              >
                <div className="flex items-start gap-3">
                  {result.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 mb-2">
                      {index + 1}. {result.questionText}
                    </p>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-slate-500">Pergjigja jote:</span>{' '}
                        <span
                          className={cn(
                            'font-medium',
                            result.isCorrect ? 'text-green-700' : 'text-red-700'
                          )}
                        >
                          {result.studentAnswer || '(Pa pergjigjur)'}
                        </span>
                      </p>
                      {!result.isCorrect && (
                        <p>
                          <span className="text-slate-500">Pergjigja e sakte:</span>{' '}
                          <span className="font-medium text-green-700">
                            {result.correctAnswer}
                          </span>
                        </p>
                      )}
                      {result.explanation && (
                        <p className="text-slate-600 mt-2 p-2 bg-white/50 rounded">
                          <span className="font-medium">Shpjegim:</span> {result.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-500">
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

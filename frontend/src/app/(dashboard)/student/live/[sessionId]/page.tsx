'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Users,
  MessageSquare,
  ThumbsUp,
  Loader2,
  ArrowLeft,
  Send,
  CheckCircle,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/stores/auth-store';
import { liveSessionsApi, type LiveSession, type LiveQuestion, type ChatMessage } from '@/lib/api/live-sessions';
import { connectSocket, getSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';

export default function StudentLivePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { token, user } = useAuthStore();

  const [session, setSession] = useState<LiveSession | null>(null);
  const [questions, setQuestions] = useState<LiveQuestion[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [participantCount, setParticipantCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [votedQuestions, setVotedQuestions] = useState<Set<string>>(new Set());

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (token && session) {
      const socket = connectSocket(token);

      socket.emit('session:join', sessionId);

      socket.on('session:started', (data: { sessionId: string; startedAt: string }) => {
        setSession((prev) => prev ? { ...prev, status: 'LIVE', startedAt: data.startedAt } : prev);
      });

      socket.on('session:ended', () => {
        setSession((prev) => prev ? { ...prev, status: 'ENDED', endedAt: new Date().toISOString() } : prev);
      });

      socket.on('session:participantCount', (data: { count: number }) => {
        setParticipantCount(data.count);
      });

      socket.on('question:new', (question: LiveQuestion) => {
        setQuestions((prev) => [...prev, question]);
      });

      socket.on('question:upvoted', (data: { questionId: string; upvotes: number }) => {
        setQuestions((prev) =>
          prev.map((q) => (q.id === data.questionId ? { ...q, upvotes: data.upvotes } : q))
        );
      });

      socket.on('question:answered', (data: { questionId: string }) => {
        setQuestions((prev) =>
          prev.map((q) => (q.id === data.questionId ? { ...q, isAnswered: true } : q))
        );
      });

      socket.on('chat:message', (message: ChatMessage) => {
        setChatMessages((prev) => [...prev, message]);
      });

      return () => {
        socket.emit('session:leave', sessionId);
        socket.off('session:started');
        socket.off('session:ended');
        socket.off('session:participantCount');
        socket.off('question:new');
        socket.off('question:upvoted');
        socket.off('question:answered');
        socket.off('chat:message');
      };
    }
  }, [token, session?.id, sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadSession = async () => {
    setIsLoading(true);
    try {
      const res = await liveSessionsApi.getSession(sessionId);
      if (res.data) {
        setSession(res.data);
        setQuestions(res.data.questions || []);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!questionInput.trim()) return;
    setIsAskingQuestion(true);
    try {
      await liveSessionsApi.askQuestion(sessionId, questionInput.trim());
      setQuestionInput('');
    } catch (error) {
      console.error('Failed to ask question:', error);
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const handleUpvote = async (questionId: string) => {
    if (votedQuestions.has(questionId)) return;
    try {
      await liveSessionsApi.upvoteQuestion(sessionId, questionId);
      setVotedQuestions((prev) => new Set([...Array.from(prev), questionId]));
    } catch (error) {
      console.error('Failed to upvote:', error);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('chat:message', {
        sessionId,
        message: chatInput.trim(),
        userName: `${user?.firstName} ${user?.lastName}`,
      });
      setChatInput('');
    }
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    if (a.isAnswered !== b.isAnswered) return a.isAnswered ? 1 : -1;
    return b.upvotes - a.upvotes;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <p className="text-muted-foreground">Sesioni nuk u gjet</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/student/dashboard')}
              className="text-muted-foreground/60 hover:text-white hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kthehu
            </Button>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <h1 className="font-semibold text-lg flex items-center gap-3">
                {session.title}
                {session.status === 'LIVE' && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">
                {session.instructor?.firstName} {session.instructor?.lastName} • {session.course.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <Users className="h-4 w-4" />
              <span className="text-sm">{participantCount} pjesemarres</span>
            </div>

            <Badge
              variant={
                session.status === 'LIVE'
                  ? 'destructive'
                  : session.status === 'SCHEDULED'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {session.status === 'LIVE' ? 'LIVE' : session.status === 'SCHEDULED' ? 'Planifikuar' : 'Perfunduar'}
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="text-muted-foreground/60 hover:text-white"
            >
              {isChatOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Main Area - Questions */}
        <div className={cn('flex-1 flex flex-col', isChatOpen ? 'w-[70%]' : 'w-full')}>
          {/* Ask Question Form */}
          {session.status === 'LIVE' && (
            <div className="p-6 border-b border-slate-700">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-lg font-semibold mb-3">Bej nje Pyetje</h2>
                <div className="flex gap-3">
                  <Textarea
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="Shkruaj pyetjen tende..."
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-muted-foreground resize-none"
                    rows={2}
                  />
                  <Button
                    onClick={handleAskQuestion}
                    disabled={isAskingQuestion || !questionInput.trim()}
                    className="self-end"
                  >
                    {isAskingQuestion ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Questions List */}
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-2xl mx-auto space-y-3">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ThumbsUp className="h-5 w-5" />
                Pyetjet ({questions.filter((q) => !q.isAnswered).length} pa pergjigje)
              </h2>

              {sortedQuestions.map((question) => (
                <Card
                  key={question.id}
                  className={cn(
                    'bg-slate-800 border-slate-700',
                    question.isAnswered && 'opacity-60'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleUpvote(question.id)}
                        disabled={votedQuestions.has(question.id) || question.isAnswered || session.status !== 'LIVE'}
                        className={cn(
                          'flex flex-col items-center gap-1 px-2 py-1 rounded transition-colors',
                          votedQuestions.has(question.id)
                            ? 'text-indigo-400'
                            : 'text-muted-foreground hover:text-indigo-400 hover:bg-slate-700'
                        )}
                      >
                        <ThumbsUp className="h-5 w-5" />
                        <span className="text-sm font-medium">{question.upvotes}</span>
                      </button>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">
                          {question.student.firstName} {question.student.lastName}
                          {question.studentId === user?.id && (
                            <Badge variant="secondary" className="ml-2 text-xs">Ti</Badge>
                          )}
                        </p>
                        <p className={cn('text-white', question.isAnswered && 'line-through')}>
                          {question.questionText}
                        </p>
                      </div>
                      {question.isAnswered && (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <ThumbsUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Asnje pyetje ende</p>
                  <p className="text-sm mt-1">Behu i pari qe pyet!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Sidebar */}
        {isChatOpen && (
          <div className="w-[30%] border-l border-slate-700 flex flex-col">
            <div className="p-4 border-b border-slate-700">
              <h2 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat
              </h2>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'max-w-[90%] p-3 rounded-lg',
                      msg.userId === user?.id
                        ? 'ml-auto bg-primary'
                        : 'bg-slate-700'
                    )}
                  >
                    <p className="text-xs text-muted-foreground/60 mb-1">{msg.userName}</p>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-slate-700">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex gap-2"
              >
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Mesazh..."
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-muted-foreground"
                  disabled={session.status !== 'LIVE'}
                />
                <Button type="submit" size="icon" disabled={session.status !== 'LIVE' || !chatInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

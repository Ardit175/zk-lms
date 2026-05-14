'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Play,
  Square,
  Clock,
  Users,
  MessageSquare,
  CheckCircle,
  ThumbsUp,
  Loader2,
  ArrowLeft,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/stores/auth-store';
import { liveSessionsApi, type LiveSession, type LiveQuestion, type ChatMessage } from '@/lib/api/live-sessions';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { sq } from 'date-fns/locale';

export default function InstructorLivePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { token, user } = useAuthStore();

  const [session, setSession] = useState<LiveSession | null>(null);
  const [questions, setQuestions] = useState<LiveQuestion[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [participantCount, setParticipantCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session?.status === 'LIVE' && session.startedAt) {
      interval = setInterval(() => {
        const start = new Date(session.startedAt!).getTime();
        setElapsedTime(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session?.status, session?.startedAt]);

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

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await liveSessionsApi.start(sessionId);
    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEnd = async () => {
    if (!confirm('Jeni te sigurt qe deshironi te perfundoni sesionin?')) return;
    setIsEnding(true);
    try {
      await liveSessionsApi.end(sessionId);
    } catch (error) {
      console.error('Failed to end session:', error);
    } finally {
      setIsEnding(false);
    }
  };

  const handleMarkAnswered = async (questionId: string) => {
    try {
      await liveSessionsApi.markAnswered(sessionId, questionId);
    } catch (error) {
      console.error('Failed to mark as answered:', error);
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

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    if (a.isAnswered !== b.isAnswered) return a.isAnswered ? 1 : -1;
    return b.upvotes - a.upvotes;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Sesioni nuk u gjet</p>
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
              onClick={() => router.push('/instructor/live')}
              className="text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kthehu
            </Button>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <h1 className="font-semibold text-lg">{session.title}</h1>
              <p className="text-sm text-slate-400">{session.course.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="h-4 w-4" />
              <span className="text-sm">{participantCount}</span>
            </div>

            {session.status === 'LIVE' && (
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="text-sm font-mono">{formatTime(elapsedTime)}</span>
              </div>
            )}

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

            {session.status === 'SCHEDULED' && (
              <Button onClick={handleStart} disabled={isStarting} className="bg-green-600 hover:bg-green-700">
                {isStarting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                Fillo Sesionin
              </Button>
            )}

            {session.status === 'LIVE' && (
              <Button onClick={handleEnd} disabled={isEnding} variant="destructive">
                {isEnding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Square className="h-4 w-4 mr-2" />}
                Perfundo
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Chat */}
        <div className="w-[60%] border-r border-slate-700 flex flex-col">
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
                    'max-w-[80%] p-3 rounded-lg',
                    msg.userId === user?.id
                      ? 'ml-auto bg-indigo-600'
                      : 'bg-slate-700'
                  )}
                >
                  <p className="text-xs text-slate-300 mb-1">{msg.userName}</p>
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
                placeholder="Shkruaj mesazh..."
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                disabled={session.status !== 'LIVE'}
              />
              <Button type="submit" disabled={session.status !== 'LIVE' || !chatInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Right Panel - Q&A */}
        <div className="w-[40%] flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h2 className="font-semibold flex items-center gap-2">
              <ThumbsUp className="h-5 w-5" />
              Pyetje ({questions.filter((q) => !q.isAnswered).length} pa pergjigje)
            </h2>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {sortedQuestions.map((question) => (
                <Card
                  key={question.id}
                  className={cn(
                    'bg-slate-800 border-slate-700',
                    question.isAnswered && 'opacity-60'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 mb-1">
                          {question.student.firstName} {question.student.lastName}
                        </p>
                        <p className={cn('text-sm text-white', question.isAnswered && 'line-through')}>
                          {question.questionText}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {question.upvotes}
                        </Badge>
                        {!question.isAnswered && session.status === 'LIVE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAnswered(question.id)}
                            className="border-green-600 text-green-500 hover:bg-green-600 hover:text-white"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {question.isAnswered && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  Asnje pyetje ende
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

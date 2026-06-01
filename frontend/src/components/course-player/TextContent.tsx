'use client';

import { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sanitizeHtml } from '@/lib/sanitize';

interface TextContentProps {
  content: string;
  isCompleted: boolean;
  onComplete: () => void;
}

export function TextContent({ content, isCompleted, onComplete }: TextContentProps) {
  const [isMarking, setIsMarking] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);

  const handleMarkComplete = async () => {
    setIsMarking(true);
    try {
      await onComplete();
      setCompleted(true);
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <article
        className="prose prose-slate max-w-none p-6 prose-headings:text-slate-900 prose-p:text-slate-600 prose-a:text-indigo-600 prose-strong:text-slate-900 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />

      <div className="border-t border-slate-200 p-6">
        {completed ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Mesimi u perfundua</span>
          </div>
        ) : (
          <Button onClick={handleMarkComplete} disabled={isMarking}>
            {isMarking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Duke shenuar...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Shenoje si te Perfunduar
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

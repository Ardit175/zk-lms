'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle2 } from 'lucide-react';

// react-player is browser-only — load it with SSR disabled
const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
  loading: () => <div className="aspect-video w-full animate-pulse rounded-xl bg-slate-200" />,
});

export type VideoType = 'YOUTUBE' | 'VIMEO' | 'UPLOAD';

export function detectVideoType(url: string): VideoType {
  if (/(?:youtube\.com|youtu\.be)/i.test(url)) return 'YOUTUBE';
  if (/vimeo\.com/i.test(url)) return 'VIMEO';
  return 'UPLOAD';
}

const TYPE_LABELS: Record<VideoType, string> = {
  YOUTUBE: 'YouTube',
  VIMEO: 'Vimeo',
  UPLOAD: 'Video i ngarkuar',
};

interface VideoPlayerProps {
  videoUrl: string;
  lessonId: string;
  videoType?: VideoType | null;
  onComplete: () => void;
  /** fraction of the video that counts as "watched" (default 0.9 = 90%) */
  completionThreshold?: number;
}

export function VideoPlayer({
  videoUrl,
  lessonId,
  videoType,
  onComplete,
  completionThreshold = 0.9,
}: VideoPlayerProps) {
  const completedRef = useRef(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const storageKey = `video-progress-${lessonId}`;
  const resolvedType = videoType ?? detectVideoType(videoUrl);

  // Uploaded files are stored as relative paths on the backend
  const src =
    resolvedType === 'UPLOAD' && videoUrl.startsWith('/')
      ? `${process.env.NEXT_PUBLIC_API_URL || ''}${videoUrl}`
      : videoUrl;

  const markComplete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setHasCompleted(true);
    onComplete();
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    const saved = localStorage.getItem(storageKey);
    if (saved && el.duration && Number(saved) < el.duration - 1) {
      el.currentTime = Number(saved);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    if (!el.duration) return;
    localStorage.setItem(storageKey, String(el.currentTime));
    if (el.currentTime / el.duration >= completionThreshold) {
      markComplete();
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-black">
        <ReactPlayer
          src={src}
          controls
          width="100%"
          height="100%"
          style={{ aspectRatio: '16 / 9' }}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={markComplete}
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {TYPE_LABELS[resolvedType]}
        </span>
        {hasCompleted && (
          <span className="flex items-center gap-1.5 font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Mesimi u shenua si i perfunduar
          </span>
        )}
      </div>
    </div>
  );
}

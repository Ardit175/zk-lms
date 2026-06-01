'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveFileUrl } from '@/lib/fileUrl';

// pdf.js worker, version-matched to the installed pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  pdfUrl: string;
  isCompleted?: boolean;
  onComplete?: () => void;
}

export function PdfViewer({ pdfUrl, isCompleted, onComplete }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState(false);
  const [width, setWidth] = useState(760);
  const [completed, setCompleted] = useState(!!isCompleted);
  const [isMarking, setIsMarking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const src = useMemo(() => resolveFileUrl(pdfUrl), [pdfUrl]);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setWidth(Math.min(containerRef.current.offsetWidth - 48, 900));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const handleMarkComplete = async () => {
    if (!onComplete) return;
    setIsMarking(true);
    try {
      await onComplete();
      setCompleted(true);
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1 || error}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-slate-600">
            Faqja {error ? '—' : pageNumber} nga {error ? '—' : numPages || '…'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages || error}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <a href={src} download target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Shkarko PDF
          </Button>
        </a>
      </div>

      {/* Document */}
      <div
        ref={containerRef}
        className="flex max-h-[70vh] justify-center overflow-auto bg-slate-100 p-6"
      >
        {error ? (
          <div className="flex flex-col items-center py-16 text-center">
            <FileText className="mb-3 h-12 w-12 text-slate-300" />
            <p className="font-medium text-slate-900">PDF-ja nuk u shfaq dot</p>
            <p className="mt-1 text-sm text-slate-500">
              Provo ta shkarkosh per ta hapur.
            </p>
            <a href={src} download target="_blank" rel="noopener noreferrer" className="mt-4">
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Shkarko PDF
              </Button>
            </a>
          </div>
        ) : (
          <Document
            file={src}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              setError(false);
            }}
            onLoadError={() => setError(true)}
            loading={
              <div className="flex items-center gap-2 py-16 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Duke ngarkuar PDF...
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={width}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-md"
            />
          </Document>
        )}
      </div>

      {/* Complete */}
      {onComplete && (
        <div className="border-t border-slate-100 p-4">
          {completed ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Mesimi u perfundua</span>
            </div>
          ) : (
            <Button onClick={handleMarkComplete} disabled={isMarking}>
              {isMarking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Shenoje si te Perfunduar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

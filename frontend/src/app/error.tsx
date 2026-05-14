'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          Dicka shkoi gabim!
        </h1>

        <p className="text-slate-600 mb-8">
          Na vjen keq, por ndodhi nje gabim i papritur.
          Ju lutem provoni perseri ose kthehuni ne faqen kryesore.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={reset} variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Provo Perseri
          </Button>
          <Link href="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Faqja Kryesore
            </Button>
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-slate-400">
            Kodi i gabimit: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

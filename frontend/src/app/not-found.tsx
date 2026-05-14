import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="h-12 w-12 text-indigo-600" />
        </div>

        <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>

        <h2 className="text-xl font-semibold text-slate-700 mb-3">
          Faqja nuk u gjet
        </h2>

        <p className="text-slate-600 mb-8">
          Faqja qe kerkoni nuk ekziston ose eshte zhvendosur.
          Kontrolloni URL-ne ose kthehuni ne faqen kryesore.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/">
            <Button size="lg">
              <Home className="h-4 w-4 mr-2" />
              Faqja Kryesore
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Compass, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="mesh-bg" />
      <div className="relative w-full max-w-md text-center">
        <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/15 blur-2xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-border bg-card">
            <Compass className="h-11 w-11 text-primary" />
          </div>
        </div>

        <p className="font-display text-7xl font-bold tracking-tight text-foreground">404</p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">Faqja nuk u gjet</h2>
        <p className="mx-auto mt-3 max-w-sm text-muted-foreground">
          Faqja qe kerkoni nuk ekziston ose eshte zhvendosur. Kontrolloni URL-ne ose kthehuni ne faqen kryesore.
        </p>

        <div className="mt-8 flex items-center justify-center">
          <Link href="/">
            <Button size="lg">
              <Home className="mr-2 h-4 w-4" />
              Faqja Kryesore
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

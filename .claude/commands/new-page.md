# Skill: new-page

Kur thirret `/new-page [role] [pageName] [description]`, krijo nje faqe te plote Next.js duke ndjekur GJITHMONE kete strukture:

## Struktura e Domosdoshme

### 1. Page file (`/frontend/src/app/[role]/[page-name]/page.tsx`)
```typescript
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
// Importo komponente shadcn/ui te nevojshme

export const metadata: Metadata = {
  title: '[Page Title] | EduAI',
};

export default async function [PageName]Page() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">[Titulli]</h1>
        <p className="text-muted-foreground">[Pershkrimi]</p>
      </div>
      {/* Permbajtja */}
    </div>
  );
}
```

### 2. Client components (kur duhet interaktivitet)
Krijo ne `/frontend/src/components/[role]/[ComponentName].tsx`:
```typescript
'use client';

import { useState } from 'react';
// shadcn/ui imports

interface [ComponentName]Props {
  // props
}

export function [ComponentName]({ }: [ComponentName]Props) {
  return (
    // JSX me shadcn/ui komponente
  );
}
```

### 3. Data fetching (kur duhen te dhena nga API)
Per Server Components perdor fetch direkt:
```typescript
async function getData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/[resource]`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: 'no-store', // ose revalidate per cache
  });
  return res.json();
}
```

## Rregulla te Detyrueshme Design
- GJITHMONE perdor ngjyrat: `slate` per tekst/background, `indigo` per accent/primary actions
- GJITHMONE perdor shadcn/ui komponente (Button, Card, Table, Dialog, Form, etc.) — mos shkruaj CSS custom
- GJITHMONE shto `text-muted-foreground` per tekste dytesore
- Kartela stats: perdor `<Card>` me `<CardHeader>`, `<CardContent>`, ikona Lucide React
- Tabele te dhena: perdor shadcn/ui `<Table>` me pagination
- Loading states: perdor `<Skeleton>` nga shadcn/ui
- Empty states: shfaq nje mesazh te qarte me nje CTA buton
- Responsive: mobile-first me Tailwind breakpoints (sm:, md:, lg:)
- Spacing konsistent: `space-y-6` per sekisone kryesore, `gap-4` per grid

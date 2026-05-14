# Skill: db-migrate

Kur thirret `/db-migrate [description]`, ekzekuto migracionin e bazes se te dhenave duke ndjekur kete proces:

## Procesi i Detyrueshem

### Hapi 1 — Verifiko ndryshimet ne schema
```bash
# Shiko çfare ka ndryshuar
git diff backend/prisma/schema.prisma
```

### Hapi 2 — Krijo migracionin
```bash
cd backend
npx prisma migrate dev --name [description-in-english-kebab-case]
```

### Hapi 3 — Verifiko migracionin
```bash
# Kontrollo qe SQL i gjeneruar eshte korrekt
cat prisma/migrations/[latest]/migration.sql
```

### Hapi 4 — Gjeneroi Prisma Client
```bash
npx prisma generate
```

### Hapi 5 — Seed (nese eshte migracion i pare ose ka te dhena te reja seed)
```bash
npx prisma db seed
```

## Rregulla te Detyrueshme
- KURRRE mos ekzekuto `prisma migrate reset` ne production
- GJITHMONE emerto migracionin ne anglisht kebab-case (p.sh. `add-certificate-table`)
- Pas cdo migracion, verifiko qe aplikacioni starton pa gabime: `npm run dev`
- Nese migracion deshtoi, kontrollo `.env` DATABASE_URL perpara çdo gjeje tjeter
- Per shtimin e kolonave te reja ne tabela ekzistuese, gjithmone shto `?` (optional) ose `@default()` per backward compatibility
- Pas migracionit, perditeso seed file-in nese ka te dhena test te reja

## Seed File Standard (`/backend/prisma/seed.ts`)
Seed-i duhet te krijoje GJITHMONE:
- 1 Admin user: `admin@zklms.com` / `Admin123!`
- 2 Instructor users: `instructor1@zklms.com`, `instructor2@zklms.com`
- 3 Student users: `student1@zklms.com`, `student2@zklms.com`, `student3@zklms.com`
- 2-3 kurse demo me module dhe lessons
- Disa enrollments dhe progress records per te testuar dashboard-et

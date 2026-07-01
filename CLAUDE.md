# EduAI — Sistem Menaxhimi Mesimi (Diploma Project)

## Konteksti i Projektit

Ky eshte projekti i diplomes per nje studend te vitit te trete ne Inxhinieri Software.
Tema: **"Sistem i Menaxhimit te Mesimit (LMS) me Bashkepunim ne Kohe Reale dhe Gjenerim Automatik te Permbajtjes me AI"**

Relaconi i plote i diplomes ndodhet ne `/docs/relacion_tema2_LMS_FINAL.docx`.

---

## Struktura e Monorepos

```
edu-ai/
├── /frontend          → Next.js 14 (App Router) + TypeScript + shadcn/ui + Tailwind CSS
├── /backend           → Node.js + Express + TypeScript + Prisma ORM + PostgreSQL 16
├── /ai-service        → Python 3.11 + FastAPI + LangChain + OpenAI SDK
├── /docs              → Dokumentacioni akademik (Word, diagrama)
├── docker-compose.yml
├── .github/workflows/ → CI/CD me GitHub Actions
└── README.md
```

---

## Stack Teknik — FINAL (mos devijo nga ky stack)

| Shtresa | Teknologjia | Versioni |
|---|---|---|
| Frontend framework | Next.js App Router | 14 |
| UI Components | shadcn/ui + Tailwind CSS | latest |
| Frontend language | TypeScript | 5.x |
| State management | Zustand | latest |
| HTTP client | React Query (TanStack Query) | v5 |
| Backend runtime | Node.js | 20 LTS |
| Backend framework | Express | 4.x |
| Backend language | TypeScript | 5.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 16 |
| Auth | NextAuth.js | v5 |
| Auth tokens | JWT | - |
| Realtime | Socket.io | 4.x |
| Cache / Queue | Redis | 7.x |
| AI orchestration | LangChain | latest |
| AI provider | OpenAI API (GPT-4o) | latest |
| AI service framework | FastAPI (Python) | 0.100+ |
| Python version | Python | 3.11 |
| Validation (BE) | Zod | 3.x |
| Validation (FE) | Zod + react-hook-form | - |
| Testing (BE) | Jest + Supertest | - |
| Testing (FE) | Playwright | - |
| Containerization | Docker + Docker Compose | - |
| CI/CD | GitHub Actions | - |
| Reverse proxy | Nginx | - |

---

## Design System — FINAL

- **Mode:** Light mode only
- **Color palette:** `slate` si baze, `indigo` si accent kryesor
- **Font:** Inter (Google Fonts)
- **Components:** shadcn/ui (Radix UI underneath) — gjithmone perdor shadcn/ui komponente, mos shkruaj CSS custom pa arsye
- **UI feel:** Clean, minimal, dashboard-style — si Linear ose Vercel dashboard
- **Icons:** Lucide React (vine me shadcn/ui)
- **Dark mode:** NUK implementohet per MVP

---

## Rolet e Sistemit — FINAL

| Roli (enum) | Pershkrimi |
|---|---|
| `ADMIN` | Menaxhon te gjithe platformen, perdoruesit, kurset (aprovimi), konfigurimin |
| `INSTRUCTOR` | Krijon dhe menaxhon kurset e veta, kuizet, detyrat, sesionet live |
| `STUDENT` | Regjistrohet ne kurse, ndjek permbajtjen, ploteson kuize, merr certifikata |

### Route protection:
- `/admin/**` → vetem ADMIN
- `/instructor/**` → vetem INSTRUCTOR  
- `/student/**` → vetem STUDENT
- `/` → public (landing page, kurs preview)

---

## Skema e Bazes se te Dhenave (Prisma Schema — E PLOTE)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ───────────────────────────────────────────────────────────────────

enum Role {
  ADMIN
  INSTRUCTOR
  STUDENT
}

enum CourseLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

enum CourseStatus {
  DRAFT
  PENDING_REVIEW
  PUBLISHED
  ARCHIVED
}

enum LessonType {
  VIDEO
  TEXT
  QUIZ
  ASSIGNMENT
}

enum EnrollmentStatus {
  ACTIVE
  COMPLETED
  DROPPED
}

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  SHORT_ANSWER
}

enum SubmissionType {
  TEXT
  FILE
  LINK
}

enum LiveSessionStatus {
  SCHEDULED
  LIVE
  ENDED
}

enum NotificationType {
  COURSE_APPROVED
  COURSE_REJECTED
  ASSIGNMENT_DUE
  ASSIGNMENT_GRADED
  QUIZ_GRADED
  LIVE_STARTING
  CERTIFICATE_READY
  ENROLLMENT_NEW
  SYSTEM_MESSAGE
}

// ─── CORE USER ────────────────────────────────────────────────────────────────

model User {
  id               String    @id @default(cuid())
  email            String    @unique
  passwordHash     String
  firstName        String
  lastName         String
  role             Role      @default(STUDENT)
  avatarUrl        String?
  isActive         Boolean   @default(true)
  isEmailVerified  Boolean   @default(false)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // Relations
  instructorProfile  InstructorProfile?
  studentProfile     StudentProfile?
  coursesCreated     Course[]              @relation("InstructorCourses")
  enrollments        Enrollment[]
  quizAttempts       QuizAttempt[]
  submissions        AssignmentSubmission[] @relation("StudentSubmissions")
  gradedSubmissions  AssignmentSubmission[] @relation("GradedByInstructor")
  liveSessionsHosted LiveSession[]
  liveQuestions      LiveQuestion[]
  notifications      Notification[]
  certificates       Certificate[]
}

model InstructorProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  bio         String?
  expertise   String[]
  websiteUrl  String?
  socialLinks Json?    // { twitter, linkedin, github }
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model StudentProfile {
  id             String   @id @default(cuid())
  userId         String   @unique
  learningGoals  String?
  completedHours Float    @default(0)
  streakDays     Int      @default(0)
  lastStudiedAt  DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ─── COURSE HIERARCHY ────────────────────────────────────────────────────────

model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  iconUrl   String?
  createdAt DateTime @default(now())

  courses Course[]
}

model Course {
  id               String       @id @default(cuid())
  title            String
  description      String
  slug             String       @unique
  thumbnailUrl     String?
  level            CourseLevel  @default(BEGINNER)
  status           CourseStatus @default(DRAFT)
  price            Float        @default(0)
  totalDuration    Int          @default(0) // minutes
  enrollmentCount  Int          @default(0)
  completionRate   Float        @default(0)
  averageRating    Float        @default(0)
  instructorId     String
  categoryId       String?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  instructor   User      @relation("InstructorCourses", fields: [instructorId], references: [id])
  category     Category? @relation(fields: [categoryId], references: [id])
  modules      Module[]
  enrollments  Enrollment[]
  liveSessions LiveSession[]
}

model Module {
  id          String   @id @default(cuid())
  courseId    String
  title       String
  description String?
  orderIndex  Int
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  course  Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons Lesson[]
}

model Lesson {
  id          String     @id @default(cuid())
  moduleId    String
  title       String
  content     String?    // Rich text (HTML/Markdown)
  videoUrl    String?
  duration    Int?       // seconds
  orderIndex  Int
  type        LessonType @default(TEXT)
  isPreview   Boolean    @default(false)
  isPublished Boolean    @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  module          Module           @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  quiz            Quiz?
  assignment      Assignment?
  lessonProgress  LessonProgress[]
}

// ─── ENROLLMENT & PROGRESS ───────────────────────────────────────────────────

model Enrollment {
  id              String           @id @default(cuid())
  studentId       String
  courseId        String
  status          EnrollmentStatus @default(ACTIVE)
  progressPercent Float            @default(0)
  enrolledAt      DateTime         @default(now())
  completedAt     DateTime?
  lastAccessedAt  DateTime?

  student         User             @relation(fields: [studentId], references: [id])
  course          Course           @relation(fields: [courseId], references: [id])
  lessonProgress  LessonProgress[]
  certificate     Certificate?

  @@unique([studentId, courseId])
}

model LessonProgress {
  id             String    @id @default(cuid())
  enrollmentId   String
  lessonId       String
  isCompleted    Boolean   @default(false)
  watchedSeconds Int       @default(0)
  completedAt    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  enrollment Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  lesson     Lesson     @relation(fields: [lessonId], references: [id])

  @@unique([enrollmentId, lessonId])
}

// ─── QUIZ SYSTEM ─────────────────────────────────────────────────────────────

model Quiz {
  id            String   @id @default(cuid())
  lessonId      String   @unique
  title         String
  description   String?
  timeLimit     Int?     // seconds, null = no limit
  passingScore  Int      @default(70) // percentage
  maxAttempts   Int      @default(3)
  isAiGenerated Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  lesson    Lesson        @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  questions QuizQuestion[]
  attempts  QuizAttempt[]
}

model QuizQuestion {
  id           String       @id @default(cuid())
  quizId       String
  questionText String
  type         QuestionType @default(MULTIPLE_CHOICE)
  orderIndex   Int
  points       Int          @default(1)
  explanation  String?
  createdAt    DateTime     @default(now())

  quiz    Quiz         @relation(fields: [quizId], references: [id], onDelete: Cascade)
  options QuizOption[]
  answers QuizAnswer[]
}

model QuizOption {
  id         String  @id @default(cuid())
  questionId String
  optionText String
  isCorrect  Boolean @default(false)

  question QuizQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  answers  QuizAnswer[]
}

model QuizAttempt {
  id            String    @id @default(cuid())
  quizId        String
  studentId     String
  score         Float?
  isPassed      Boolean?
  attemptNumber Int
  startedAt     DateTime  @default(now())
  completedAt   DateTime?

  quiz    Quiz         @relation(fields: [quizId], references: [id])
  student User         @relation(fields: [studentId], references: [id])
  answers QuizAnswer[]

  @@unique([quizId, studentId, attemptNumber])
}

model QuizAnswer {
  id               String  @id @default(cuid())
  attemptId        String
  questionId       String
  selectedOptionId String?
  textAnswer       String?
  isCorrect        Boolean @default(false)
  pointsEarned     Int     @default(0)

  attempt        QuizAttempt  @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question       QuizQuestion @relation(fields: [questionId], references: [id])
  selectedOption QuizOption?  @relation(fields: [selectedOptionId], references: [id])
}

// ─── ASSIGNMENT SYSTEM ───────────────────────────────────────────────────────

model Assignment {
  id             String         @id @default(cuid())
  lessonId       String         @unique
  title          String
  description    String
  instructions   String
  dueDate        DateTime?
  maxScore       Int            @default(100)
  submissionType SubmissionType @default(TEXT)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  lesson      Lesson                 @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  submissions AssignmentSubmission[]
}

model AssignmentSubmission {
  id          String    @id @default(cuid())
  assignmentId String
  studentId   String
  content     String?
  fileUrl     String?
  linkUrl     String?
  submittedAt DateTime  @default(now())
  score       Int?
  feedback    String?
  gradedAt    DateTime?
  gradedById  String?

  assignment Assignment @relation(fields: [assignmentId], references: [id])
  student    User       @relation("StudentSubmissions", fields: [studentId], references: [id])
  gradedBy   User?      @relation("GradedByInstructor", fields: [gradedById], references: [id])

  @@unique([assignmentId, studentId])
}

// ─── LIVE SESSIONS ───────────────────────────────────────────────────────────

model LiveSession {
  id           String            @id @default(cuid())
  courseId     String
  instructorId String
  title        String
  description  String?
  scheduledAt  DateTime
  startedAt    DateTime?
  endedAt      DateTime?
  status       LiveSessionStatus @default(SCHEDULED)
  recordingUrl String?
  createdAt    DateTime          @default(now())

  course     Course         @relation(fields: [courseId], references: [id])
  instructor User           @relation(fields: [instructorId], references: [id])
  questions  LiveQuestion[]
}

model LiveQuestion {
  id           String   @id @default(cuid())
  sessionId    String
  studentId    String
  questionText String
  upvotes      Int      @default(0)
  isAnswered   Boolean  @default(false)
  askedAt      DateTime @default(now())

  session LiveSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  student User        @relation(fields: [studentId], references: [id])
}

// ─── NOTIFICATIONS & CERTIFICATES ───────────────────────────────────────────

model Notification {
  id                String           @id @default(cuid())
  userId            String
  type              NotificationType
  title             String
  body              String
  isRead            Boolean          @default(false)
  relatedEntityId   String?
  relatedEntityType String?
  createdAt         DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Certificate {
  id                String   @id @default(cuid())
  enrollmentId      String   @unique
  studentId         String
  courseId          String
  certificateNumber String   @unique @default(cuid())
  verificationCode  String   @unique @default(cuid())
  pdfUrl            String?
  issuedAt          DateTime @default(now())

  enrollment Enrollment @relation(fields: [enrollmentId], references: [id])
  student    User       @relation(fields: [studentId], references: [id])
}
```

---

## Komunikimi Ndermjet Sherbimeve

```
Browser (port 3000)
     │
     ▼
Next.js Frontend (:3000)
     │  REST API calls + WebSocket
     ▼
Express Backend (:4000)
     │              │
     │              ▼
     │        AI-Service (:8000)
     │        FastAPI + LangChain + OpenAI
     │
     ├── PostgreSQL (:5432)  [via Prisma]
     └── Redis (:6379)       [cache + socket adapter]
```

## Environment Variables

```bash
# /backend/.env
DATABASE_URL="postgresql://postgres:password@localhost:5432/eduai"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
REDIS_URL="redis://localhost:6379"
AI_SERVICE_URL="http://localhost:8000"
OPENAI_API_KEY="sk-..."
PORT=4000
NODE_ENV="development"

# /frontend/.env.local
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4000"

# /ai-service/.env
OPENAI_API_KEY="sk-..."
BACKEND_URL="http://localhost:4000"
PORT=8000
```

---

## Dashboardet — Pershkrim i Detajuar

### Admin Dashboard (/admin/dashboard)
- Kartela stats: total perdorues (sipas rolit), kurse aktive, regjistrime te reja (30 dite), kurse ne PENDING_REVIEW
- Grafik linear: aktiviteti tremujor (regjistrime + perfundime)
- Tabele: kurset PENDING_REVIEW me butonin Aprovo/Refuzo
- Tabele: perdoruesit e regjistruar se fundmi
- Menaxhim perdoruesish: CRUD, ndryshim roli, aktivizim/deaktivizim
- Menaxhim kursesh: listim i plote me filter (status, kategori, instruktor)
- Settings: kategori, konfigurim email, limitet e skedareve, politika certifikatash

### Instructor Dashboard (/instructor/dashboard)
- Kartela: total studente, norma perfundimi, vleresim mesatar, kurse aktive
- Grafik: regjistrime te reja per 7/30/90 dite
- Lista kurseve me mini-stats per cdo kurs
- Seksioni "Veprime te Kerkuara": detyra pa-vleresuar, komente te pa-lexuara
- Course Builder: drag-and-drop module/lesson, rich text editor (TipTap), upload video, AI quiz generator
- Analytics per kurs: histogram progresit studenteve, norma perfundimi per modul, pyetjet me veshtiresi
- Vleresim detyrave: tabele doryzimeve, feedback me markdown, piket
- Sesionet Live: planifikim, nderfaqe split (chat + pyetjet e renditura sipas votave)

### Student Dashboard (/student/dashboard)
- Seksioni "Vazhdo Mesimin": kursi i fundit aksesuar, progress bar, butoni "Vazhdo"
- Kartela stats: ore studimi, kuize te kryera, norma suksesi, streak ditor
- Kalendar detyrave me afate
- Lista kurseve te regjistruara me progres
- Course Player: layout 2-kolona (video/permbajtje + navigues hierarkik), checkmarks per mesime te kryera
- Kuizet: nje pyetje ne kohe, timer, rezultat me shpjegim, historik tentativash
- Certifikatat: karta vizuale, shkarkim PDF, URL verifikimi publik
- Profili: grafik radar kompetencash, streak, statistika totale

---

## Funksionalitetet Kryesore — Prioriteti MVP

### Faza 1 — Themelet (FILLOJME KETU)
- [ ] Monorepo setup me Docker Compose
- [ ] Prisma schema + migracion fillestar
- [ ] Auth i plote (register, login, JWT, 3 role)
- [ ] Layout-et e ndara per 3 rolet
- [ ] Skeleton dashboard-et me te dhena placeholder

### Faza 2 — Kurset
- [ ] CRUD kursesh (instruktor)
- [ ] Module + Lesson management
- [ ] Course player (student)
- [ ] Enrollment system
- [ ] Progress tracking

### Faza 3 — AI dhe Realtime
- [ ] AI Quiz Generator (ai-service + integrimi)
- [ ] Live sessions me Socket.io
- [ ] Notification system (realtime)
- [ ] Collaborative editor (TipTap realtime)

### Faza 4 — Polishim
- [ ] Analytics dashboards
- [ ] Certificate generation (PDF)
- [ ] Testing (Jest, Playwright)
- [ ] CI/CD pipeline

---

## Rregulla te Rendesishme per Zhvillimin

1. **Gjithmone TypeScript** — asnje `any` pa arsye te dokumentuar
2. **Prisma per te gjitha DB queries** — asnje SQL raw pa arsye te fortes
3. **Zod per validim** — ne backend (middleware) dhe frontend (forms)
4. **shadcn/ui per komponente** — mos rishpik rrotat, perdor komponente ekzistuese
5. **Error handling konsistent** — te gjitha API responses ne formatin `{ success, data, error }`
6. **RBAC ne çdo endpoint** — requireRole() middleware per çdo route te mbrojtur
7. **Env variables** — asnje secret hardcoded, gjithmone nga `.env`
8. **Commits atomike** — nje feature/fix per commit, mesazhe ne anglisht

---

## Referenca te Rendesishme

- Relacion diplome: `/docs/relacion_tema2_LMS_FINAL.docx`
- shadcn/ui docs: https://ui.shadcn.com
- NextAuth v5 docs: https://authjs.dev
- Prisma docs: https://prisma.io/docs
- Socket.io docs: https://socket.io/docs
- LangChain docs: https://js.langchain.com/docs

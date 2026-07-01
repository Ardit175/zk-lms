# EduAI — System Architecture

This document describes the runtime topology, service responsibilities, persistence layer,
authentication lifecycle, and AI content pipeline of the EduAI platform.

---

## 1. Monorepo Structure

```
edu-ai/
├── frontend/                 Next.js 14 (App Router) · TypeScript · shadcn/ui · Tailwind
│   ├── app/                  Route segments grouped by role (/admin, /instructor, /student)
│   ├── components/           Reusable UI (shadcn primitives + composite components)
│   ├── lib/                  API client, auth helpers, utilities
│   ├── stores/               Zustand stores (auth, UI state)
│   ├── middleware.ts         Route protection by role
│   └── types/                Shared TypeScript types
│
├── backend/                  Node.js 20 · Express · TypeScript · Prisma · PostgreSQL
│   └── src/
│       ├── index.ts          HTTP + Socket.io bootstrap
│       ├── routes/           One router per resource (auth, courses, quizzes, …)
│       ├── controllers/      Request handlers
│       ├── services/         Domain logic (notifications, certificates, AI bridge)
│       ├── middleware/       auth, validate, error
│       ├── validators/       Zod schemas
│       ├── lib/              jwt, socket, prisma client
│       ├── utils/            ApiResponse envelope, helpers
│       └── config/           Env-driven configuration
│
├── ai-service/               Python 3.11 · FastAPI · LangChain · OpenAI SDK
│   └── app/
│       ├── main.py           FastAPI app + CORS
│       ├── routers/          quiz, extraction
│       ├── services/         quiz_generator, content_summarizer,
│       │                     pdf_extractor, youtube_extractor,
│       │                     audio_transcriber (Whisper)
│       └── schemas/          Pydantic request/response models
│
├── docs/                     Academic deliverables (this folder)
├── docker-compose.yml        Local stack (Postgres + Redis + 3 services)
├── Makefile                  Common workflows (db migrate, dev, test)
└── .github/workflows/        CI/CD pipelines
```

---

## 2. Service Communication Flow

```
                           ┌────────────────────┐
                           │      Browser       │
                           │   (Next.js UI)     │
                           └─────────┬──────────┘
                                     │  HTTPS (REST + WebSocket)
                                     ▼
                           ┌────────────────────┐
                           │   Next.js Server   │  port 3000
                           │  - App Router      │
                           │  - NextAuth v5     │
                           │  - SSR / RSC       │
                           └─────────┬──────────┘
                                     │  JSON (Bearer JWT)
                                     ▼
       ┌──────────────────────────────────────────────────────────┐
       │              Express API + Socket.io                     │  port 4000
       │  - Auth, RBAC                                            │
       │  - CRUD (Courses, Quizzes, Assignments, Sessions)        │
       │  - Realtime fan-out (notifications, chat, Q&A)           │
       └─────┬──────────────────────┬───────────────────┬─────────┘
             │                      │                   │
             │ Prisma SQL           │ Redis             │ HTTP
             ▼                      ▼                   ▼
       ┌───────────┐         ┌────────────┐    ┌──────────────────┐
       │ Postgres  │         │   Redis    │    │  AI Service      │  port 8000
       │   16      │         │  cache +   │    │  FastAPI         │
       │           │         │  pubsub    │    │  - Quiz Gen      │
       └───────────┘         └────────────┘    │  - Summarizer    │
                                               │  - PDF / YouTube │
                                               │  - Whisper       │
                                               └────────┬─────────┘
                                                        │
                                                        ▼
                                                ┌──────────────┐
                                                │  OpenAI API  │
                                                │ GPT-4o /     │
                                                │ Whisper-1    │
                                                └──────────────┘
```

**Synchronous paths**
- Browser → Next.js → Express: REST over JSON, JWT in `Authorization` header.
- Express → AI Service: server-to-server HTTP. The Express layer authenticates the user, then forwards a sanitised payload to FastAPI.

**Asynchronous paths**
- Express ↔ Browser: Socket.io for notifications, live-session chat and Q&A. Authenticated through the same JWT on the WebSocket handshake.
- Redis: shared adapter for Socket.io rooms and short-lived caches (rate limits, dashboard aggregations).

---

## 3. Database Schema Summary (Prisma)

The schema is normalised around four sub-domains: identity, course hierarchy, assessment,
and engagement. Cascading deletes follow content ownership (Course → Module → Lesson →
Quiz/Assignment).

```
┌──────────┐ 1   1 ┌──────────────────┐
│   User   │───────│ InstructorProfile │
│ (id, role│ 1   1 ├──────────────────┤
│  email,  │───────│  StudentProfile  │
│ pwHash)  │       └──────────────────┘
└──┬───┬───┘
   │   │ 1                                            ┌─────────────┐
   │   └─────────────────────────────────────────────►│ Notification│
   │ 1                                                └─────────────┘
   │                  ┌──────────┐
   │ owns *           │ Category │
   ├─────────────────►│          │◄──────┐
   │                  └──────────┘       │
   │                                     │ 0..1
   │   ┌────────────┐  *   1 ┌───────────┴─┐ 1   *  ┌──────────┐ 1  *  ┌──────────┐
   └──►│   Course   │────────│   Course    │────────│  Module  │───────│  Lesson  │
       │  (status,  │        │             │        │ (order)  │       │  (type)  │
       │   level)   │        └─────────────┘        └──────────┘       └─────┬────┘
       └─────┬──────┘                                                        │
             │ 1                                                             │ 1  0..1
             │                                                               ▼
             │ *                                                       ┌──────────┐
             │                                                         │   Quiz   │
             │                                                         └─────┬────┘
             │                                                               │ 1  *
             │                                                               ▼
             │ ┌──────────────┐ *   1 ┌──────────┐ *   1 ┌─────────────┐ *   1
             └─│  Enrollment  │───────│ Lesson   │       │ QuizQuestion │
               │ (progress%)  │       │ Progress │       │  (+options)  │
               └──────┬───────┘       └──────────┘       └──────┬───────┘
                      │ 1                                       │ 1
                      ▼ 0..1                                    ▼ *
               ┌─────────────┐                          ┌──────────────┐
               │ Certificate │                          │ QuizAttempt  │
               └─────────────┘                          │  → QuizAnswer│
                                                        └──────────────┘

┌─────────────┐ 1   * ┌────────────┐ 1   *  ┌───────────────┐
│  Course     │───────│ LiveSession│────────│ LiveQuestion  │
└─────────────┘       └────────────┘        └───────────────┘

┌────────────┐ 1   0..1 ┌─────────────────────┐ 1   *  ┌─────────────────────┐
│   Lesson   │──────────│     Assignment      │────────│ AssignmentSubmission │
└────────────┘          │ (dueDate, maxScore) │        │ (score, gradedBy)    │
                        └─────────────────────┘        └─────────────────────┘
```

**Key tables (selected columns)**

| Table | Important fields | Notes |
|---|---|---|
| `User` | `role` (ADMIN \| INSTRUCTOR \| STUDENT), `email` (unique), `passwordHash` | Polymorphic via two optional 1-1 profile tables |
| `Course` | `status`, `level`, `instructorId`, `categoryId`, `slug` (unique) | Status drives moderation workflow |
| `Module` / `Lesson` | `orderIndex`, `isPublished` | Ordering exposed via reorder endpoints |
| `Enrollment` | unique `(studentId, courseId)`, `progressPercent` | Drives certificate issuance at 100 % |
| `LessonProgress` | unique `(enrollmentId, lessonId)`, `watchedSeconds` | Resume-where-you-left feature |
| `Quiz` / `QuizQuestion` / `QuizOption` / `QuizAttempt` / `QuizAnswer` | `isAiGenerated`, `passingScore`, `attemptNumber` | Per-attempt grading; max attempts enforced |
| `Assignment` / `AssignmentSubmission` | `submissionType`, `gradedById`, `feedback` | Manual grading by instructor |
| `LiveSession` / `LiveQuestion` | `status`, `upvotes`, `isAnswered` | Realtime via Socket.io rooms |
| `Notification` | `type`, `relatedEntityId`, `isRead` | Fanned out by user room |
| `Certificate` | `verificationCode` (unique, public), `pdfUrl` | Verifiable via public URL |

---

## 4. Authentication & JWT Lifecycle

```
┌────────────┐                       ┌────────────┐                   ┌────────────┐
│   Client   │                       │ Express BE │                   │  Postgres  │
└─────┬──────┘                       └──────┬─────┘                   └──────┬─────┘
      │ 1. POST /api/auth/login            │                                │
      │ { email, password }                 │                                │
      ├────────────────────────────────────►│                                │
      │                                     │ 2. SELECT user WHERE email     │
      │                                     ├───────────────────────────────►│
      │                                     │◄───────────────────────────────┤
      │                                     │ 3. bcrypt.compare(pw, hash)    │
      │                                     │ 4. jwt.sign({ id, role },      │
      │                                     │    JWT_SECRET, exp=7d)         │
      │ 5. 200 { user, token }              │                                │
      │◄────────────────────────────────────┤                                │
      │                                     │                                │
      │ 6. Stores token in localStorage     │                                │
      │    / NextAuth session cookie        │                                │
      │                                     │                                │
      │ 7. GET /api/courses/my-courses     │                                │
      │    Authorization: Bearer <token>    │                                │
      ├────────────────────────────────────►│                                │
      │                                     │ 8. requireAuth middleware:     │
      │                                     │    verifyToken(token)          │
      │                                     │    → attaches req.user         │
      │                                     │ 9. requireRole('INSTRUCTOR')   │
      │                                     │ 10. Handler executes query     │
      │ 11. 200 { data: [...] }             │                                │
      │◄────────────────────────────────────┤                                │

WebSocket handshake (Socket.io):
      │ 12. io({ auth: { token } })         │
      ├────────────────────────────────────►│
      │     io.use((socket, next) => {      │
      │       payload = verifyToken(token); │
      │       socket.userId = payload.id;   │
      │       socket.join('user:<id>');     │
      │     })                              │
```

**Token characteristics**
- Algorithm: HS256, secret from `JWT_SECRET` env.
- Lifetime: `JWT_EXPIRES_IN` (default 7 days). No refresh token in MVP — re-authentication required on expiry.
- Payload: `{ id, role, iat, exp }`.
- Transport: `Authorization: Bearer <jwt>` header for REST, `socket.handshake.auth.token` for Socket.io.
- Validation: shared `verifyToken()` helper used by both middleware and the socket handshake guard, ensuring identical trust boundaries.

**Authorisation layers**
1. `requireAuth` — validates the JWT, populates `req.user`.
2. `requireRole(...roles)` — rejects with `403` if the user's role is not allowed.
3. Resource ownership checks inside controllers (e.g., an instructor can only mutate their own courses).

---

## 5. AI Pipeline — Source → Text → Quiz

The AI service offers three ingestion paths that all converge on a common quiz-generation
step. Each path is independently retryable and produces an `ExtractionResponse` carrying
plain text plus provenance metadata.

```
                       ┌──────────────────────────────────────────┐
                       │           Instructor (Browser)           │
                       └──────────────────────┬───────────────────┘
                                              │
                                              ▼ chooses source
            ┌─────────────────────┬───────────────────────┬─────────────────────┐
            │                     │                       │                     │
            ▼ PDF                 ▼ YouTube               ▼ Audio / Video       ▼ Free text
   POST /api/ai/extract/pdf  POST /api/ai/extract/      POST /api/ai/extract/   (skip step 1)
   multipart file (≤25 MB)   youtube { url, lang? }     audio multipart file
            │                     │                       │                     │
            ▼                     ▼                       ▼                     │
   ┌────────────────┐   ┌─────────────────────┐   ┌──────────────────┐         │
   │ pdf_extractor  │   │ youtube_extractor   │   │ audio_transcriber│         │
   │ (PyMuPDF)      │   │ (youtube-transcript │   │ (OpenAI Whisper) │         │
   │ → text+meta    │   │  -api)              │   │ → text+language  │         │
   └────────┬───────┘   └──────────┬──────────┘   └──────────┬───────┘         │
            └───────────┬──────────┴─────────────────────────┘                 │
                        ▼                                                       │
              ┌───────────────────────┐                                         │
              │ ExtractionResponse    │◄────────────────────────────────────────┘
              │ { content,            │
              │   source_type,        │
              │   char_count,         │
              │   truncated,          │
              │   metadata }          │
              └──────────┬────────────┘
                         │
                         ▼ instructor reviews / edits text in UI
              ┌───────────────────────┐
              │  POST /api/ai/quiz-   │
              │  generator/generate   │
              │  { content,           │
              │    num_questions,     │
              │    question_types[],  │
              │    difficulty,        │
              │    topic? }           │
              └──────────┬────────────┘
                         │ Express forwards to FastAPI
                         ▼
              ┌──────────────────────────────────────┐
              │  quiz_generator (LangChain + GPT-4o) │
              │  1. Prompt template applied          │
              │  2. JSON-mode response               │
              │  3. Pydantic validation              │
              │  4. Retry on schema failure          │
              └──────────────────┬───────────────────┘
                                 │ QuizGenerationResponse
                                 ▼
              ┌──────────────────────────────────────┐
              │  Instructor reviews questions in UI  │
              │  Edits text / correct options /      │
              │  explanations as needed              │
              └──────────────────┬───────────────────┘
                                 │ POST /api/quizzes
                                 ▼
                          ┌──────────────┐
                          │  Postgres    │
                          │ Quiz + Q + O │
                          │ isAiGenerated│
                          │   = true     │
                          └──────────────┘
```

**Pipeline guarantees**
- 25 MB upload ceiling for PDF and audio/video (Whisper's hard limit).
- Inputs are truncated client-side and server-side to fit OpenAI context windows; the `truncated` flag is surfaced to the UI.
- The AI service never persists user data; only the Express layer writes to Postgres after instructor approval.
- All AI failures map to `422` (malformed model output) or `500` (provider failure), giving the UI clear messages to display.

---

## 6. Deployment Notes

- **Local development:** `docker-compose up` provisions Postgres 16, Redis 7, the Express backend, the FastAPI AI service and the Next.js frontend.
- **CI:** GitHub Actions runs `prisma migrate deploy`, type checks, Jest backend tests, and Pytest AI-service tests on every push.
- **Production target:** containers fronted by Nginx as a reverse proxy with TLS termination; Postgres and Redis as managed services.

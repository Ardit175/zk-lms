# EduAI — REST API Reference

**Base URL (Express backend):** `http://localhost:4000/api`
**Base URL (AI service):** `http://localhost:8000`
**Authentication:** JSON Web Token (JWT) passed via the `Authorization: Bearer <token>` header.
**Response envelope (Express):** `{ "success": boolean, "data": <payload>, "error": <message?> }`

---

## 1. Health & System

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | none | Backend health probe |
| `GET` | `/` | none | API banner |
| `GET` | `/uploads/:file` | none | Static file delivery (with cross-origin CORP) |

```bash
curl http://localhost:4000/health
```

---

## 2. Authentication (`/api/auth`)

### `POST /api/auth/register` — public
Registers a new account. The `role` field may only be `STUDENT` or `INSTRUCTOR`; `ADMIN` accounts are seeded.

Request body:
```json
{
  "email": "student@example.com",
  "password": "Passw0rd!",
  "firstName": "Ana",
  "lastName": "Bardha",
  "role": "STUDENT"
}
```
Response: `{ success, data: { user, token } }`

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"a@b.com","password":"Passw0rd!","firstName":"Ana","lastName":"B","role":"STUDENT"}'
```

### `POST /api/auth/login` — public
Body: `{ "email": "...", "password": "..." }` → `{ user, token }`.

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@b.com","password":"Passw0rd!"}'
```

### `GET /api/auth/me` — any authenticated role
Returns the current user profile.

### `POST /api/auth/logout` — any authenticated role
Stateless logout (token is discarded client-side).

---

## 3. Courses (`/api/courses`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/stats` | public | Aggregate platform statistics |
| `GET` | `/featured` | public | Featured course carousel |
| `GET` | `/` | public | Paginated list with `?search`, `?level`, `?category`, `?page`, `?limit` |
| `GET` | `/slug/:slug` | public | Course detail (by slug) |
| `GET` | `/my-courses` | INSTRUCTOR | Courses owned by current instructor |
| `GET` | `/:id` | INSTRUCTOR, ADMIN | Course detail (by id) |
| `POST` | `/` | INSTRUCTOR | Create new course |
| `PUT` | `/:id` | INSTRUCTOR | Update course |
| `DELETE` | `/:id` | INSTRUCTOR | Delete course (cascades modules/lessons) |
| `PATCH` | `/:id/status` | INSTRUCTOR, ADMIN | Move between `DRAFT \| PENDING_REVIEW \| PUBLISHED \| ARCHIVED` |

**Create course body**
```json
{
  "title": "Introduction to Python",
  "description": "A beginner-friendly tour of the language.",
  "categoryId": "ckxxx...",
  "level": "BEGINNER",
  "price": 0
}
```

```bash
curl -X POST http://localhost:4000/api/courses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Intro to Python","description":"Hands-on first steps with the Python language.","level":"BEGINNER","price":0}'
```

### Modules (nested under a course)
| Method | Path | Auth |
|---|---|---|
| `GET` | `/:id/modules` | any auth |
| `POST` | `/:id/modules` | INSTRUCTOR |
| `PUT` | `/:id/modules/:moduleId` | INSTRUCTOR |
| `DELETE` | `/:id/modules/:moduleId` | INSTRUCTOR |
| `PATCH` | `/:id/modules/reorder` | INSTRUCTOR |

### Lessons (nested under a module)
| Method | Path | Auth |
|---|---|---|
| `POST` | `/:id/modules/:moduleId/lessons` | INSTRUCTOR |
| `PUT` | `/:id/modules/:moduleId/lessons/:lessonId` | INSTRUCTOR |
| `DELETE` | `/:id/modules/:moduleId/lessons/:lessonId` | INSTRUCTOR |
| `PATCH` | `/:id/modules/:moduleId/lessons/reorder` | INSTRUCTOR |

**Create lesson body**
```json
{
  "title": "Variables and Types",
  "content": "<p>Rich-text HTML…</p>",
  "videoUrl": "https://www.youtube.com/watch?v=...",
  "videoType": "YOUTUBE",
  "duration": 600,
  "type": "VIDEO",
  "isPreview": false
}
```

---

## 4. Categories (`/api/categories`)

| Method | Path | Auth |
|---|---|---|
| `GET` | `/` | public |
| `POST` | `/` | ADMIN |
| `PUT` | `/:id` | ADMIN |
| `DELETE` | `/:id` | ADMIN |

---

## 5. Enrollments (`/api/enrollments`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/` | STUDENT | Enroll in a course (body: `{ courseId }`) |
| `GET` | `/my-courses` | STUDENT | Courses the student is enrolled in |
| `GET` | `/:courseId/progress` | STUDENT | Detailed progress for a single course |
| `PATCH` | `/:courseId/lessons/:lessonId/complete` | STUDENT | Mark a lesson complete (optional `{ watchedSeconds }`) |

```bash
curl -X POST http://localhost:4000/api/enrollments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"ckxxx..."}'
```

---

## 6. Quizzes (`/api/quizzes`)

### Instructor
| Method | Path | Description |
|---|---|---|
| `POST` | `/` | Create a quiz (with questions and options) |
| `GET` | `/lesson/:lessonId` | Load a quiz for editing |
| `DELETE` | `/:id` | Remove a quiz |

### Student
| Method | Path | Description |
|---|---|---|
| `GET` | `/:id` | Fetch quiz (questions without correct flags) |
| `POST` | `/:id/attempts` | Start a new attempt |
| `POST` | `/attempts/:attemptId/submit` | Submit answers |
| `GET` | `/:id/my-attempts` | List the student's past attempts |

**Submit attempt body**
```json
{
  "answers": [
    { "questionId": "q1", "selectedOptionId": "opt2" },
    { "questionId": "q3", "textAnswer": "An interpreter" }
  ]
}
```

---

## 7. Assignments (`/api/assignments`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/:id/submit` | STUDENT | Submit work (text / fileUrl / linkUrl) |
| `GET` | `/:id/my-submission` | STUDENT | Latest own submission |
| `GET` | `/lesson/:lessonId` | STUDENT | Resolve assignment by lesson id |
| `GET` | `/course/:courseId` | INSTRUCTOR | All assignments in a course |
| `GET` | `/:id/submissions` | INSTRUCTOR | Submissions for an assignment |
| `PATCH` | `/submissions/:id/grade` | INSTRUCTOR | `{ score, feedback? }` |

---

## 8. Live Sessions (`/api/live-sessions`)

### Instructor
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/` | Schedule new session |
| `GET` | `/my-sessions` | Owned sessions |
| `PATCH` | `/:id/start` | Move SCHEDULED → LIVE |
| `PATCH` | `/:id/end` | Move LIVE → ENDED |
| `PATCH` | `/:id/questions/:qid/answer` | Mark a question answered |

### Student
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/upcoming` | Upcoming sessions for enrolled courses |
| `POST` | `/:id/questions` | Ask a question (body: `{ questionText }`) |

### Shared
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/:id` | Session details + question feed |
| `PATCH` | `/:id/questions/:qid/upvote` | Upvote a question |

---

## 9. Notifications (`/api/notifications`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/` | any auth | Paginated history |
| `GET` | `/unread` | any auth | Unread items |
| `GET` | `/unread/count` | any auth | Badge counter |
| `PATCH` | `/:id/read` | any auth | Mark one as read |
| `PATCH` | `/read-all` | any auth | Mark all read |

---

## 10. Certificates (`/api/certificates`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/:verificationCode/verify` | public | Verify authenticity (shareable URL) |
| `GET` | `/my-certificates` | STUDENT | Earned certificates |
| `GET` | `/:id/download` | STUDENT | Download PDF |

```bash
curl http://localhost:4000/api/certificates/abc123/verify
```

---

## 11. Student Dashboard (`/api/student`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/stats` | Hours, quizzes, success rate, streak |
| `GET` | `/deadlines` | Upcoming assignment deadlines |
| `GET` | `/competencies` | Radar-chart competency data |
| `GET` | `/continue-learning` | Last-accessed lesson resume card |

All require STUDENT role.

---

## 12. Instructor Analytics (`/api/instructor`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/courses/:id/analytics` | Enrollment trend, completion rate, quiz difficulty per course |

---

## 13. Admin (`/api/admin`) — all endpoints require ADMIN

| Method | Path | Description |
|---|---|---|
| `GET` | `/stats` | Platform-wide counters |
| `GET` | `/charts/enrollments` | Daily enrollment trend |
| `GET` | `/charts/top-courses` | Top courses by enrollment |
| `GET` | `/users` | List users (filterable) |
| `PATCH` | `/users/:id` | Change role / active status |
| `DELETE` | `/users/:id` | Soft-delete user |
| `GET` | `/courses` | All courses (any status) |
| `GET` | `/courses/:id` | Course detail for moderation |
| `POST` | `/courses/:id/review` | Approve or reject (`{ action, reason? }`) |

---

## 14. Uploads (`/api/uploads`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/` | any auth | Multipart upload (`file`); 50 MB max; pdf/doc/image/video |

```bash
curl -X POST http://localhost:4000/api/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@lecture.mp4"
```

Returns: `{ url: "/uploads/<filename>" }`.

---

## 15. AI Bridge (`/api/ai`) — Express → FastAPI proxy

All endpoints require INSTRUCTOR.

| Method | Path | Body | Purpose |
|---|---|---|---|
| `POST` | `/quiz-generator/generate` | JSON (see below) | Generate quiz from text |
| `POST` | `/content-summarizer/summarize` | `{ content, title? }` | Lesson summary + keywords |
| `POST` | `/extract/pdf` | multipart `file` | Extract text from PDF |
| `POST` | `/extract/youtube` | `{ url, language? }` | Fetch YouTube transcript |
| `POST` | `/extract/audio` | multipart `file` (≤25 MB) | Whisper audio/video transcription |

**Quiz generation body**
```json
{
  "content": "Python is an interpreted language…",
  "num_questions": 5,
  "question_types": ["MULTIPLE_CHOICE", "TRUE_FALSE"],
  "difficulty": "INTERMEDIATE",
  "topic": "Introduction to Python"
}
```

```bash
curl -X POST http://localhost:4000/api/ai/quiz-generator/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"…","num_questions":5,"question_types":["MULTIPLE_CHOICE"],"difficulty":"BEGINNER"}'
```

---

## 16. AI Service Direct Endpoints (FastAPI, port 8000)

These are normally called by the backend, but can be hit directly during development.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness probe |
| `POST` | `/api/quiz-generator/generate` | Generate quiz (same schema as §15) |
| `POST` | `/api/content-summarizer/summarize` | Summary + keywords |
| `POST` | `/api/content-extractor/pdf` | Extract PDF (multipart `file`) |
| `POST` | `/api/content-extractor/youtube` | Extract YouTube transcript |
| `POST` | `/api/content-extractor/audio` | Whisper transcription (multipart `file`, optional `label`) |

```bash
curl -X POST http://localhost:8000/api/content-extractor/youtube \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

---

## 17. Realtime Channel (Socket.io, port 4000)

Connect with `auth: { token: <jwt> }`. Every authenticated socket joins the personal room `user:<userId>`.

| Event (client → server) | Payload | Effect |
|---|---|---|
| `session:join` | `sessionId` | Join `session:<id>` room, broadcast participant count |
| `session:leave` | `sessionId` | Leave room, broadcast new count |
| `chat:message` | `{ sessionId, message, userName }` | Echo to room |
| `notification:markRead` | `notificationId` | Echo `notification:read` back |

| Event (server → client) | Payload |
|---|---|
| `notification:new` | `Notification` |
| `notification:read` | `{ notificationId }` |
| `session:participantCount` | `{ count }` |
| `chat:message` | `{ id, userId, userName, message, timestamp }` |
| `liveQuestion:new` | `LiveQuestion` |
| `liveQuestion:upvoted` | `{ id, upvotes }` |
| `liveSession:started` / `liveSession:ended` | `LiveSession` |

---

## Error Format

Backend errors always use:
```json
{ "success": false, "error": "Description of the failure" }
```

Typical HTTP codes: `400` validation, `401` missing/invalid token, `403` role mismatch, `404` not found, `409` conflict (duplicate email, duplicate enrollment), `413` payload too large, `422` AI returned malformed data, `500` internal error.

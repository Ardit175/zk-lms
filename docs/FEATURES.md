# EduAI — Feature Catalogue by Role

The platform exposes three distinct experiences, each protected by route-level role guards
(`/admin/**`, `/instructor/**`, `/student/**`). The features below are organised by the role
that primarily uses them. Shared concerns (authentication, notifications, certificate
verification) are listed at the end.

---

## 1. Administrator (`ADMIN`)

The administrator oversees the entire platform: people, content, and configuration.

### 1.1 Platform Dashboard
- **Aggregate statistics:** total users by role, active courses, new enrolments over the last
  30 days, and the number of courses currently in `PENDING_REVIEW`.
- **Activity charts:** quarterly enrolment and completion trends rendered as line graphs.
- **Moderation queue:** a table of pending courses with one-click *Approve* / *Reject* actions
  and reason capture.
- **Recent users table:** latest sign-ups with quick links to the user-management page.

### 1.2 User Management
- **List & filter** all users with search by name/email, filter by role and activation status.
- **Role assignment:** promote/demote between `ADMIN`, `INSTRUCTOR`, and `STUDENT`.
- **Activation control:** disable accounts (`isActive = false`) without deleting them.
- **Account removal:** hard delete with cascade through related profiles.

### 1.3 Course Moderation
- **Global course catalogue** filtered by status (DRAFT / PENDING_REVIEW / PUBLISHED /
  ARCHIVED), category and instructor.
- **Course inspection screen** with full module/lesson outline plus instructor profile.
- **Approval workflow:** approve sends the course to `PUBLISHED` and notifies the instructor;
  rejection records a reason and notifies the instructor with feedback.

### 1.4 Taxonomy & Configuration
- **Category CRUD:** create, edit and delete the categories used by instructors when
  publishing courses.
- **Platform settings (planned):** category icons, default certificate template, upload
  limits, and notification channels.

---

## 2. Instructor (`INSTRUCTOR`)

The instructor authors and operates courses end-to-end.

### 2.1 Instructor Dashboard
- **KPI cards:** total enrolled students, average completion rate, average rating, and active
  course count.
- **Enrolment chart:** new enrolments over 7 / 30 / 90 day windows.
- **Course summary list:** mini stats per course (enrolment, completion, rating).
- **Action centre:** ungraded assignment submissions and unanswered live-session questions
  surfaced as a to-do list.

### 2.2 Course Builder
- **Course CRUD:** create, edit, archive courses with title, description, level, price,
  thumbnail and category.
- **Module & lesson management:** drag-and-drop reordering, nested module → lesson hierarchy,
  publish flags at every level.
- **Lesson editor:** rich-text editor (TipTap) for HTML/Markdown content, video URL embedding
  (YouTube / Vimeo) or direct upload, PDF attachment, duration field, preview toggle.
- **Submission for review:** move a course from `DRAFT` to `PENDING_REVIEW` for admin approval.

### 2.3 AI-Assisted Content (Multi-Modal)
- **PDF ingestion:** upload a PDF up to 25 MB; the AI service extracts text and reports
  truncation.
- **YouTube ingestion:** paste a video URL; the transcript is fetched (with language
  preference) and prepared for downstream use.
- **Audio / video ingestion:** upload an audio or video file; OpenAI Whisper transcribes it.
- **Free-text ingestion:** paste arbitrary lesson text directly.
- **Quiz generator:** choose number of questions (1–20), question types
  (multiple choice / true-false / short answer), and difficulty
  (beginner / intermediate / advanced); the AI returns a structured quiz that the instructor
  can edit before saving.
- **Content summariser:** generate key points, a short summary and SEO keywords from any
  lesson source.

### 2.4 Assessments
- **Quiz builder:** create quizzes manually or from AI output; set time limit, passing score,
  max attempts and per-question explanation.
- **Quiz deletion:** remove existing quizzes attached to a lesson.
- **Assignment management:** define written, file, or link submissions with optional due
  date and maximum score.
- **Submission review:** view all submissions per assignment, grade with score + feedback
  (markdown).

### 2.5 Live Sessions
- **Scheduling:** create a session under a course with title, description and start time.
- **Lifecycle controls:** start (`SCHEDULED → LIVE`) and end (`LIVE → ENDED`) sessions.
- **Realtime chat:** broadcast messages to participants via Socket.io rooms.
- **Q&A:** students submit and upvote questions; instructors mark them as answered.

### 2.6 Analytics
- **Per-course analytics:** enrolment over time, completion rate per module, average quiz
  scores, and questions ranked by difficulty (most-missed).

---

## 3. Student (`STUDENT`)

The student is the primary learner persona — the experience optimises for resumability,
clarity, and motivation.

### 3.1 Student Dashboard
- **Continue learning card:** resumes the last-accessed lesson with a progress indicator.
- **Statistics:** total study hours, quizzes completed, success rate, and current streak.
- **Upcoming deadlines:** calendar list of assignment due dates.
- **Enrolled courses:** progress bars per course with quick links into the player.

### 3.2 Course Discovery & Enrolment
- **Public catalogue** at `/courses` with search, level filter and category filter.
- **Course detail page** showing curriculum outline, preview lessons, instructor profile,
  rating and price.
- **Enrolment:** one-click enrol for free courses; status moves to `ACTIVE` and the course
  appears in the student dashboard.

### 3.3 Course Player
- **Two-column layout:** main content (video / text / PDF) on the left, hierarchical
  navigator on the right.
- **Progress tracking:** lessons can be marked complete; `watchedSeconds` is recorded for
  video lessons, enabling resume.
- **Multi-format content:** YouTube embeds, Vimeo embeds, uploaded MP4, PDF viewer and rich
  text.

### 3.4 Quizzes
- **One question per screen** with a timer when a time limit is set.
- **Attempt limits:** the platform enforces `maxAttempts`; previous attempts are visible in
  a history view.
- **Results screen:** displays score, pass/fail status, per-question correctness and
  instructor-provided explanations.

### 3.5 Assignments
- **Submission form** adapts to the assignment type (text editor, file upload, or link).
- **Submission history:** view the most recent submission, score and feedback once graded.

### 3.6 Live Sessions
- **Upcoming sessions feed** for all enrolled courses.
- **Realtime participation:** chat, ask questions, upvote questions from peers.
- **Participant counter:** updated live as users join/leave.

### 3.7 Certificates
- **Automatic issuance:** upon reaching 100 % progress on a course, a certificate is
  generated with a unique verification code.
- **My certificates page:** gallery of earned certificates with PDF download.
- **Public verification:** anyone can verify a certificate via the public URL
  `/api/certificates/<code>/verify`.

### 3.8 Profile
- **Competency radar:** visualises strengths across course categories based on quiz scores.
- **Streak & totals:** consecutive study days, total hours, quizzes passed.
- **Profile editing:** name, avatar, learning goals.

---

## 4. Cross-Cutting Capabilities

These features are available to multiple roles and underpin the role-specific experiences.

### 4.1 Authentication & Authorisation
- **Email/password registration** for `STUDENT` or `INSTRUCTOR`; `ADMIN` accounts are seeded.
- **Password policy:** minimum 8 characters with uppercase, lowercase, and digit.
- **JWT sessions** with a 7-day default expiry; identical token used for REST and Socket.io.
- **Role-based route protection** in both Next.js middleware and Express middleware.

### 4.2 Notifications
- **Realtime delivery** via Socket.io with a personal user room.
- **Persistent history** in Postgres (`Notification` table) with read/unread tracking and
  badge counters.
- **Event types:** course approval/rejection, assignment due/graded, quiz graded,
  live-session starting, certificate ready, new enrolment, and generic system messages.

### 4.3 File Uploads
- **Single endpoint** at `/api/uploads` accepting PDFs, Word documents, images and videos up
  to 50 MB.
- **Static delivery** under `/uploads/*` with relaxed cross-origin policy so the Next.js
  frontend on port 3000 can render assets served by Express on port 4000.

### 4.4 Internationalisation
- **Albanian-first UI** with English support; messages and validation errors are translated
  through a lightweight i18n layer in the frontend.

### 4.5 Search & Filtering
- **Course search** by free text, level and category on the public catalogue.
- **Admin user/course filters** for moderation workflows.

### 4.6 Observability & Tooling
- **Health probes** at `/health` for both the Express backend and the FastAPI AI service.
- **Structured logging** with Morgan (backend) and Python `logging` (AI service).
- **CI/CD** via GitHub Actions: type checks, lint, Jest + Supertest backend tests, Pytest
  AI-service tests, Playwright frontend smoke tests.

---

## 5. Roadmap (out of MVP scope)

The following capabilities are designed in the data model but not yet exposed in the UI of
the MVP release:

- Paid course checkout and revenue reporting.
- Discussion threads attached to lessons.
- Collaborative document editing inside live sessions (TipTap realtime).
- Mobile-first PWA shell with offline lesson caching.
- Multi-tenant support for institutions.

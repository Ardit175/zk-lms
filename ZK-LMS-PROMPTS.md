# ZK-LMS — Promptet e Plota per Claude Code
# Vazhdo ne kete rradhe, nje prompt ne nje kohe

---

## FAZA 1 — AUTH & FOUNDATION

### Prompt 1.1 — Database Seed
```
Create /backend/prisma/seed.ts with realistic test data:
- 1 Admin: admin@zklms.com / Admin123!
- 2 Instructors: instructor1@zklms.com, instructor2@zklms.com / Instructor123!
- 3 Students: student1@zklms.com, student2@zklms.com, student3@zklms.com / Student123!
- 2 Categories: "Web Development", "Data Science"
- 2 Courses (1 per instructor): each with 2 modules, each module with 3 lessons (mix of VIDEO/TEXT/QUIZ types)
- Enroll student1 and student2 in course 1 with some LessonProgress records
- Add InstructorProfile and StudentProfile for all relevant users

Add "seed": "ts-node prisma/seed.ts" to package.json scripts.
Run the seed and confirm all records are created.
```

---

### Prompt 1.2 — Backend Auth Endpoints
```
Implement complete auth endpoints in /backend following the /new-endpoint skill:

POST /api/auth/register
- Body: { email, password, firstName, lastName, role? }
- Hash password with bcrypt (12 rounds)
- Create User + profile (InstructorProfile or StudentProfile based on role)
- Return JWT token + user object (without passwordHash)

POST /api/auth/login  
- Body: { email, password }
- Verify password with bcrypt
- Return JWT token + user object
- Return 401 if invalid credentials

GET /api/auth/me
- Protected route (requireAuth middleware)
- Return current user from token

POST /api/auth/logout
- Client-side only (return success, token invalidation is frontend)

JWT token payload: { id, email, role, firstName, lastName }
JWT expiry: 7 days

Create /backend/src/lib/jwt.ts with generateToken() and verifyToken() helpers.
Create /backend/src/middleware/auth.ts with requireAuth and requireRole middleware.
Test all endpoints with curl examples after implementing.
```

---

### Prompt 1.3 — Frontend Auth Flow
```
Implement complete frontend authentication:

1. Connect /frontend/src/app/login/page.tsx to POST /api/auth/login
   - Use react-hook-form + zod validation
   - Show error messages inline
   - After success: save token to Zustand store + localStorage
   - Redirect to correct dashboard based on role:
     ADMIN → /admin/dashboard
     INSTRUCTOR → /instructor/dashboard  
     STUDENT → /student/dashboard

2. Connect /frontend/src/app/register/page.tsx to POST /api/auth/register
   - Fields: firstName, lastName, email, password, confirmPassword
   - Role selector (INSTRUCTOR or STUDENT only — no ADMIN registration)
   - After success: auto-login and redirect

3. Update Zustand auth store (/frontend/src/store/auth.store.ts):
   - State: { user, token, isAuthenticated, isLoading }
   - Actions: login(email, password), logout(), initialize()
   - Persist token in localStorage
   - initialize() called on app start to restore session

4. Create /frontend/src/middleware.ts (Next.js middleware):
   - Protect /admin/** → only ADMIN
   - Protect /instructor/** → only INSTRUCTOR
   - Protect /student/** → only STUDENT
   - Redirect unauthenticated users to /login
   - Redirect wrong role to their correct dashboard

5. Add logout button in all dashboard layouts.

Test the full flow: register → login → dashboard → logout → redirect to login.
```

---

## FAZA 2 — COURSES (INSTRUCTOR SIDE)

### Prompt 2.1 — Course CRUD Backend
```
Implement complete course management API using /new-endpoint skill:

GET    /api/courses              - Public list of PUBLISHED courses (with filters: category, level, search)
GET    /api/courses/:slug        - Public course detail (with modules + lessons preview)
POST   /api/courses              - Create course (INSTRUCTOR only)
PUT    /api/courses/:id          - Update course (INSTRUCTOR, own courses only)
DELETE /api/courses/:id          - Soft delete, set status ARCHIVED (INSTRUCTOR, own only)
PATCH  /api/courses/:id/status   - Change status (INSTRUCTOR: DRAFT↔PENDING_REVIEW, ADMIN: all transitions)

GET    /api/courses/:id/modules           - Get all modules with lessons
POST   /api/courses/:id/modules           - Create module (INSTRUCTOR, own course)
PUT    /api/courses/:id/modules/:moduleId - Update module
DELETE /api/courses/:id/modules/:moduleId - Delete module
PATCH  /api/courses/:id/modules/reorder  - Reorder modules (body: [{id, orderIndex}])

POST   /api/courses/:id/modules/:moduleId/lessons      - Create lesson
PUT    /api/courses/:id/modules/:moduleId/lessons/:lid - Update lesson  
DELETE /api/courses/:id/modules/:moduleId/lessons/:lid - Delete lesson
PATCH  /api/courses/:id/modules/:moduleId/lessons/reorder - Reorder lessons

All instructor routes: verify instructorId === req.user.id before any operation.
Include proper Zod validators for all request bodies.
After each route, update enrollmentCount and totalDuration on Course automatically.
```

---

### Prompt 2.2 — Course Builder UI
```
Build the Course Builder page at /instructor/courses/[id]/edit using /new-page skill:

Layout: Two-panel design
- Left panel (70%): Module/Lesson editor
- Right panel (30%): Course settings (title, description, thumbnail, level, category, price, status)

Features:
1. Drag-and-drop module reordering (use @dnd-kit/core and @dnd-kit/sortable)
2. Drag-and-drop lesson reordering within modules
3. Click module to expand/collapse its lessons
4. Click lesson to open inline edit panel (replace right panel content)
5. "Add Module" button at bottom of module list
6. "Add Lesson" button at bottom of each module
7. Each lesson shows: type icon (Video/Text/Quiz/Assignment), title, duration, published status toggle
8. Lesson types: VIDEO (url input + duration), TEXT (TipTap rich text editor), QUIZ (link to quiz builder), ASSIGNMENT (link to assignment creator)
9. Auto-save on blur for all fields (debounced 1.5s)
10. "Submit for Review" button when course is DRAFT → changes to PENDING_REVIEW
11. Status badge showing current course status with color coding

Install required packages: @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @tiptap/react @tiptap/starter-kit
Use shadcn/ui for all other components.
Color scheme: slate backgrounds, indigo accents, clean minimal look.
```

---

### Prompt 2.3 — Course List (Instructor)
```
Build /instructor/courses page using /new-page skill:

1. Grid of course cards (3 columns desktop, 2 tablet, 1 mobile)
   Each card shows: thumbnail, title, status badge, student count, completion rate, rating, last updated
   Status colors: DRAFT=slate, PENDING_REVIEW=amber, PUBLISHED=green, ARCHIVED=red

2. "Create New Course" button → opens Dialog with basic info form:
   - title, description, category (select), level (select)
   - On submit: POST /api/courses → redirect to /instructor/courses/[id]/edit

3. Filter bar: search by title, filter by status, filter by category

4. Each card has dropdown menu (shadcn DropdownMenu):
   - Edit → /instructor/courses/[id]/edit
   - Analytics → /instructor/courses/[id]/analytics  
   - View as student → /courses/[slug] (new tab)
   - Archive → confirm dialog then PATCH status to ARCHIVED

5. Empty state: illustration + "Create your first course" CTA button

Connect to GET /api/instructor/courses (create this endpoint that returns only the current instructor's courses with stats).
```

---

## FAZA 3 — ENROLLMENT & STUDENT EXPERIENCE

### Prompt 3.1 — Enrollment Backend
```
Implement enrollment system:

POST /api/enrollments
- Body: { courseId }
- Student only
- Check: course is PUBLISHED, student not already enrolled
- Create Enrollment record
- Create LessonProgress records for ALL lessons in the course (isCompleted: false)
- Increment course.enrollmentCount
- Return enrollment with course details

GET /api/enrollments/my-courses
- Student only
- Return all enrollments with course info, progress, last accessed lesson

GET /api/enrollments/:courseId/progress
- Student only, must be enrolled
- Return detailed progress: overall %, per-module %, per-lesson completion status

PATCH /api/enrollments/:courseId/lessons/:lessonId/complete
- Student only, must be enrolled
- Mark lesson as completed (isCompleted: true, completedAt: now)
- Recalculate and update Enrollment.progressPercent
- If all lessons complete: set Enrollment.status = COMPLETED, trigger certificate generation
- Return updated progress

Certificate generation (create /backend/src/services/certificate.service.ts):
- Generate unique certificateNumber and verificationCode
- Create Certificate record
- Create CERTIFICATE_READY Notification for student
- (PDF generation comes in a later phase)
```

---

### Prompt 3.2 — Course Player (Student)
```
Build the course player at /student/courses/[courseId]/learn/[lessonId]:

Layout (full screen, no sidebar):
- Top navbar: course title, progress bar (overall %), exit button → /student/dashboard

- Left sidebar (280px, scrollable):
  Course navigation tree:
  Module 1 (with completion count "2/3")
    ├─ ✅ Lesson 1 (completed - green checkmark)
    ├─ ▶ Lesson 2 (current - indigo highlight)  
    └─ 🔒 Lesson 3 (locked until lesson 2 done)
  Module 2
    └─ ... (locked until Module 1 done)
  
  Click completed or current lessons to navigate.
  Locked lessons show lock icon and tooltip "Complete previous lesson first".

- Main content area:
  VIDEO type: <video> tag with controls, marks complete when 90% watched
  TEXT type: rendered HTML/markdown content, "Mark as Complete" button at bottom
  QUIZ type: embedded quiz component (built in next prompt)
  ASSIGNMENT type: assignment submission form

- Right panel (collapsible, 300px): 
  Lesson title, description, resources/attachments

Auto-navigate to next lesson after completing current one (2 second delay with animation).
Update LessonProgress via PATCH /api/enrollments/:courseId/lessons/:lessonId/complete.
Persist last watched position in localStorage for VIDEO type.
```

---

### Prompt 3.3 — Quiz Component
```
Build the quiz taking experience as a component used inside the course player:

Component: QuizPlayer ({ quizId, onComplete })

States: LOADING → INTRO → IN_PROGRESS → REVIEWING → COMPLETED

INTRO screen:
- Quiz title, description
- Time limit (if set), number of questions, passing score, attempts remaining
- "Start Quiz" button → POST /api/quizzes/:id/attempts (create new attempt)

IN_PROGRESS screen:
- One question at a time (no jumping back, linear flow)
- Progress: "Question 3 of 10"
- Countdown timer if timeLimit set (red when <30 seconds)
- MULTIPLE_CHOICE: radio buttons with option cards (highlight on select)
- TRUE_FALSE: two large toggle buttons "True" / "False"
- SHORT_ANSWER: textarea
- "Next Question" button (disabled until answer selected)
- On last question: "Submit Quiz" button → POST /api/quizzes/attempts/:id/submit

REVIEWING screen (shown immediately after submit):
- Score: "85/100" with pass/fail indicator
- Each question shown with: 
  - Student's answer (green if correct, red if wrong)
  - Correct answer highlighted
  - Explanation text (if exists)
- "Next Lesson" button if passed
- "Try Again" button if failed and attempts remaining

Backend endpoints needed:
POST /api/quizzes/:id/attempts       - Start attempt, return attempt id + questions (without isCorrect)
POST /api/quizzes/attempts/:id/submit - Submit answers, calculate score, return results with explanations
GET  /api/quizzes/:id/my-attempts    - History of student's attempts for this quiz
```

---

## FAZA 4 — ADMIN PANEL

### Prompt 4.1 — Admin Dashboard & User Management
```
Build complete admin panel using /new-page skill for each page:

1. /admin/dashboard
   Stats cards (fetch from GET /api/admin/stats):
   - Total users (with breakdown: X admins, Y instructors, Z students)
   - Total courses (with breakdown by status)
   - New enrollments this month (with % change vs last month)
   - Courses pending review (with urgent badge if >5)
   
   Charts (use recharts library):
   - Line chart: enrollments per day (last 30 days)
   - Bar chart: top 5 courses by enrollment
   
   Pending Review table: course title, instructor name, submitted date, "Review" button

2. /admin/users
   Full data table (shadcn Table) with:
   - Columns: avatar+name, email, role badge, status (active/inactive), joined date, actions
   - Search by name/email
   - Filter by role, filter by status
   - Pagination (20 per page)
   - Row actions (DropdownMenu): View Profile, Change Role, Activate/Deactivate, Delete
   - "Invite Instructor" button → Dialog with email form

3. /admin/courses
   Table of ALL courses with:
   - Title, instructor, category, status badge, enrollments, rating, created date
   - Filter by status (highlight PENDING_REVIEW tab)
   - Click PENDING_REVIEW course → /admin/courses/[id]/review

4. /admin/courses/[id]/review
   Course preview page for admin:
   - Full course details, all modules and lessons listed
   - Instructor info card
   - Two action buttons: "Approve" (→ PUBLISHED) and "Request Changes" (→ DRAFT + reason)
   - "Request Changes" opens a Dialog with textarea for feedback message
   - After action: send Notification to instructor, redirect to /admin/courses

Backend endpoints needed (all ADMIN only):
GET  /api/admin/stats
GET  /api/admin/users (with pagination + filters)
PATCH /api/admin/users/:id (change role, activate/deactivate)
DELETE /api/admin/users/:id (soft delete)
GET  /api/admin/courses (all courses with filters)
```

---

## FAZA 5 — AI QUIZ GENERATOR

### Prompt 5.1 — AI Service Quiz Generation
```
Using /ai-feature skill, implement the quiz generator in /ai-service:

POST /api/quiz-generator/generate
Request body:
{
  "content": "string (lesson text content, max 10000 chars)",
  "numQuestions": 5,
  "questionTypes": ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"],
  "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  "topic": "string (lesson title for context)"
}

Response:
{
  "success": true,
  "questions": [
    {
      "questionText": "...",
      "type": "MULTIPLE_CHOICE",
      "points": 1,
      "explanation": "Why this answer is correct...",
      "options": [
        { "optionText": "...", "isCorrect": false },
        { "optionText": "...", "isCorrect": true },
        { "optionText": "...", "isCorrect": false },
        { "optionText": "...", "isCorrect": false }
      ]
    }
  ]
}

LangChain implementation:
- Use GPT-4o with temperature 0.4 (factual but slightly varied)
- JsonOutputParser for structured output
- Prompt must enforce: questions test understanding (not memorization), distractors are plausible, explanations are educational
- Validate output structure before returning (retry once if invalid)
- For TRUE_FALSE: options are always [{"True", isCorrect: ?}, {"False", isCorrect: ?}]
- For SHORT_ANSWER: no options array, add "sampleAnswer" field instead

Also implement POST /api/content-summarizer/summarize:
- Input: { content, title }
- Output: { keyPoints: string[], summary: string, keywords: string[] }
- Used for course SEO and student lesson previews
```

---

### Prompt 5.2 — AI Quiz Generator UI (Instructor)
```
Build the AI Quiz Generator modal in the Course Builder:

Trigger: "Generate with AI" button next to "Add Quiz" in lesson editor.

Step 1 — Input Modal (shadcn Dialog):
- Source selector: "Use lesson content" (auto-fills) or "Paste custom text" (textarea)
- Number of questions slider: 3-15 (default 5)
- Question types checkboxes: Multiple Choice ✓, True/False ✓, Short Answer
- Difficulty select: Beginner / Intermediate / Advanced
- "Generate Questions" button → POST to /api/ai/quiz-generator/generate (proxy through backend)
- Loading state: animated spinner with messages ("Analyzing content...", "Generating questions...", "Almost done...")

Step 2 — Review & Edit Modal (full screen):
- List of generated questions, each in a Card
- Each question is fully editable inline:
  - Edit question text
  - For MULTIPLE_CHOICE: edit each option, toggle correct answer (radio)
  - Add/remove options
  - Edit explanation
  - Delete question
- "Regenerate" button (goes back to step 1)
- "Add X More Questions" button (appends to current list)
- Drag to reorder questions
- "Save Quiz" button → creates Quiz + QuizQuestions + QuizOptions via POST /api/quizzes
- Show question count badge: "8 questions • 8 points total"

Backend proxy endpoint needed:
POST /api/ai/quiz-generator → forwards to ai-service, saves result temporarily in Redis (5 min TTL)
```

---

## FAZA 6 — REALTIME FEATURES

### Prompt 6.1 — Notification System
```
Implement real-time notifications with Socket.io:

Backend (/backend/src/services/notification.service.ts):
- createNotification(userId, type, title, body, relatedEntityId?, relatedEntityType?)
- After creating DB record, emit via Socket.io to room "user:{userId}"
- markAsRead(notificationId, userId)
- markAllAsRead(userId)
- getUnread(userId): return all unread notifications

Socket.io setup (/backend/src/lib/socket.ts):
- On connection: authenticate via JWT token (passed as auth.token in socket handshake)
- Join user to room "user:{userId}"
- Events emitted to client: "notification:new", "notification:read"
- Events from client: "notification:markRead" (notificationId)

Frontend Notification Bell component:
- Bell icon in top navbar of ALL dashboard layouts (admin, instructor, student)
- Red badge with unread count (hidden if 0)
- Click → Popover with notification list (max 10, most recent first)
- Each notification: icon based on type, title, body (truncated), time ago, blue dot if unread
- Click notification → mark as read + navigate to relevant page based on relatedEntityType
- "Mark all as read" button at top
- "View all" link → /[role]/notifications (full page)
- Connect to Socket.io on mount, disconnect on unmount
- Real-time: new notifications appear instantly without refresh

Trigger notifications at these moments:
- COURSE_APPROVED/REJECTED: when admin reviews course
- ENROLLMENT_NEW: when student enrolls (send to instructor)
- ASSIGNMENT_GRADED: when instructor grades submission
- CERTIFICATE_READY: when student completes course
- LIVE_STARTING: 15 minutes before live session (via scheduled job)
```

---

### Prompt 6.2 — Live Sessions
```
Implement Live Session feature:

Backend endpoints:
POST /api/live-sessions                    - Create session (INSTRUCTOR)
GET  /api/live-sessions/upcoming           - Upcoming sessions for enrolled courses (STUDENT)
GET  /api/live-sessions/my-sessions        - Instructor's sessions
PATCH /api/live-sessions/:id/start         - Start session (sets status=LIVE, startedAt=now)
PATCH /api/live-sessions/:id/end           - End session (sets status=ENDED, endedAt=now)
POST /api/live-sessions/:id/questions      - Ask question (STUDENT, session must be LIVE)
PATCH /api/live-sessions/:id/questions/:qid/upvote  - Upvote question
PATCH /api/live-sessions/:id/questions/:qid/answer  - Mark answered (INSTRUCTOR)

Socket.io events for live session (room: "session:{sessionId}"):
- "session:started"       - broadcast when instructor starts
- "session:ended"         - broadcast when instructor ends  
- "question:new"          - broadcast new question to all in room
- "question:upvoted"      - broadcast updated upvote count
- "question:answered"     - broadcast when question marked answered
- "chat:message"          - broadcast chat messages

Instructor Live Page (/instructor/live/[sessionId]):
Split layout:
- Left (60%): Session controls (Start/End buttons, timer), Chat feed (Socket.io messages)
- Right (40%): Q&A board — questions sorted by upvotes DESC, unanswered first
  Each question card: student name, question text, upvote count, "Mark Answered" button
  Answered questions collapse to bottom with strikethrough

Student Live Page (/student/live/[sessionId]):
- Top: session title, live indicator (red dot), participant count
- Center: "Ask a Question" form (textarea + submit)
- Question list (same as instructor but no "Mark Answered" button, show upvote button)
- Chat sidebar (collapsible)
- Join room on mount via Socket.io
```

---

## FAZA 7 — INSTRUCTOR ANALYTICS

### Prompt 7.1 — Course Analytics Page
```
Build /instructor/courses/[id]/analytics using recharts:

Backend: GET /api/instructor/courses/:id/analytics
Returns:
{
  overview: { totalStudents, completionRate, averageScore, averageRating },
  enrollmentOverTime: [{ date, count }],  // last 30 days
  progressDistribution: [{ range: "0-25%", count }, ...],  // 4 buckets
  moduleCompletion: [{ moduleTitle, completionRate, avgTimeMinutes }],
  hardestQuestions: [{ questionText, quizTitle, wrongAnswerRate }],  // top 5
  recentActivity: [{ studentName, action, timestamp }]  // last 20 events
}

Page layout:
Row 1 — 4 stat cards: Total Students, Completion Rate, Avg Quiz Score, Avg Rating (stars)

Row 2 — 2 charts side by side:
- Line chart: "Enrollments Over Time" (last 30 days)
- Bar chart: "Progress Distribution" (how many students in each 25% bucket)

Row 3 — Full width:
- Table: "Completion by Module" with columns: Module, Lessons, Completion Rate (progress bar), Avg Time
  
Row 4 — 2 panels:
- Left: "Hardest Questions" — list with question text, quiz name, % wrong answers (red badge)
- Right: "Recent Activity" — timeline feed (student X completed lesson Y, student Z enrolled, etc.)

All data fetched on page load with loading skeletons.
Add date range picker (last 7/30/90 days) that refetches data.
Export button: downloads analytics as CSV.
```

---

## FAZA 8 — CERTIFICATES & ASSIGNMENTS

### Prompt 8.1 — Certificate PDF Generation
```
Implement PDF certificate generation:

Install in backend: npm install puppeteer

Create /backend/src/services/pdf.service.ts:
- generateCertificate(certificateId: string): Promise<Buffer>
- Uses puppeteer to render an HTML template to PDF
- HTML template variables: studentName, courseName, instructorName, completionDate, certificateNumber, verificationCode

Certificate HTML template design:
- A4 landscape orientation
- Professional design with ZK-LMS branding
- Indigo/slate color scheme
- Large decorative border
- Student name in large elegant font (center)
- "has successfully completed" text
- Course name in bold
- Completion date, certificate number
- QR code (use qrcode npm package) encoding the verification URL
- Instructor signature line

After PDF generated:
- Save to /uploads/certificates/[certificateNumber].pdf
- Update Certificate.pdfUrl in database

Endpoints:
GET /api/certificates/:verificationCode/verify  - PUBLIC, returns certificate details (for QR scan)
GET /api/certificates/:id/download              - Student only (own certificate), returns PDF

Student Certificate Page (/student/certificates):
- Grid of certificate cards
- Each card: course thumbnail, course title, completion date, "Download PDF" button, "Share Link" button
- Share link copies public verification URL to clipboard
```

---

### Prompt 8.2 — Assignment Submission & Grading
```
Build complete assignment system:

Student side (inside course player, ASSIGNMENT lesson type):
Assignment view component:
- Assignment title, description, instructions
- Due date (red if overdue, amber if <24h)
- Submission type handling:
  TEXT: TipTap rich text editor
  FILE: drag-and-drop file upload (PDF, DOC, images, max 10MB) → upload to /api/uploads
  LINK: URL input with validation
- Submit button (disabled if no content)
- After submit: show "Submitted on [date]" status card
- If graded: show score badge, feedback text from instructor
- If not yet graded: show "Awaiting review" with spinner

Instructor side (/instructor/courses/[id]/assignments):
- Table of all assignments in the course
- For each assignment: title, total submissions, graded count, ungraded count, avg score
- Click assignment → /instructor/assignments/[id]/submissions

/instructor/assignments/[id]/submissions:
- Split view: left = submission list, right = grading panel
- Submission list: student name, submitted date, status badge (ungraded/graded), score
- Click submission → load in right panel
- Grading panel: student name, submission content (rendered based on type), 
  score input (0-maxScore), feedback textarea (markdown supported), "Save Grade" button
- Keyboard shortcuts: Ctrl+Enter to save grade, arrow keys to navigate submissions
- Progress indicator: "Graded 12 of 34"

Backend endpoints:
POST   /api/assignments/:id/submit          - Student submits
GET    /api/assignments/:id/submissions     - Instructor gets all submissions  
PATCH  /api/assignments/submissions/:id/grade - Instructor grades
POST   /api/uploads                         - File upload endpoint (multer, save to /uploads)
```

---

## FAZA 9 — STUDENT DASHBOARD COMPLETION

### Prompt 9.1 — Student Dashboard Full
```
Complete the student dashboard at /student/dashboard with full functionality:

Connect ALL sections to real API data:

1. "Continue Learning" section:
   - Fetch last accessed enrollment (GET /api/enrollments/my-courses, sort by lastAccessedAt)
   - Show course thumbnail, title, progress bar, "Continue" button → last incomplete lesson
   - If no enrollments: "Browse Courses" CTA

2. Stats cards (GET /api/student/stats):
   - Total study hours (sum of watched video seconds / 3600)
   - Quizzes completed (count of passed QuizAttempts)
   - Average quiz score (mean of all QuizAttempt scores)
   - Current streak (from StudentProfile.streakDays)

3. My Courses grid:
   - All active enrollments with progress bars
   - Filter: In Progress / Completed / All
   - Each card: thumbnail, title, instructor name, progress %, last accessed

4. Upcoming Deadlines (GET /api/student/deadlines):
   - Assignments due in next 7 days, sorted by dueDate ASC
   - Color coded: red if <24h, amber if <3 days, normal otherwise
   - Show course name, assignment title, due date/time

5. Upcoming Live Sessions (GET /api/live-sessions/upcoming):
   - Next 3 sessions from enrolled courses
   - "Join" button (active only when session is LIVE)

6. Competency Radar Chart (recharts RadarChart):
   - Axes = categories of completed courses
   - Value = average quiz score in that category
   - Shows student's strength areas visually

Update streak logic in backend:
- On any lesson completion: check if student studied yesterday
  YES: increment streakDays, update lastStudiedAt
  NO (gap > 1 day): reset streakDays to 1
  Same day: just update lastStudiedAt, no streak change
```

---

## FAZA 10 — TESTING & CICD

### Prompt 10.1 — Backend Tests
```
Using /write-tests skill, write comprehensive tests for backend:

1. Unit tests for all Services:
   - AuthService: register (success, duplicate email, weak password), login (success, wrong password, inactive user)
   - CourseService: create, update (own course only), delete (own course only), list with filters
   - EnrollmentService: enroll (success, already enrolled, course not published), progress calculation, completion trigger
   - QuizService: create attempt, submit (score calculation, pass/fail, max attempts exceeded)

2. Integration tests for all Routes:
   Test auth for EVERY route:
   - 401 when no token
   - 403 when wrong role
   - 200/201 when correct role
   
   Test business logic:
   - Student cannot enroll in same course twice
   - Instructor cannot edit another instructor's course
   - Quiz score calculated correctly
   - Progress percentage updates correctly after lesson completion

3. Create /backend/src/__tests__/helpers/auth.helper.ts:
   - generateTestToken(payload) - creates JWT for testing
   - createTestUser(role) - creates user in test DB

4. Test database: use a separate test PostgreSQL DB
   - Add TEST_DATABASE_URL to .env.example
   - beforeAll: run migrations on test DB
   - beforeEach: clean relevant tables
   - afterAll: disconnect prisma

Run tests with: npm test
Target: >70% code coverage (run npm test -- --coverage to verify)
```

---

### Prompt 10.2 — GitHub Actions CI/CD
```
Create GitHub Actions pipeline at /.github/workflows/ci.yml:

Trigger: on push to main and pull_request to main

Jobs (run in parallel where possible):

1. backend-test:
   - ubuntu-latest
   - Services: postgres:16, redis:7
   - Steps: checkout, setup Node 20, npm ci, npx prisma migrate deploy, npm test -- --coverage
   - Upload coverage report as artifact

2. frontend-lint:
   - ubuntu-latest  
   - Steps: checkout, setup Node 20, npm ci, npm run lint, npm run build
   - Fail if TypeScript errors exist

3. ai-service-test:
   - ubuntu-latest
   - Setup Python 3.11
   - Steps: checkout, pip install -r requirements.txt, pytest (create basic tests)

4. docker-build (runs after all tests pass):
   - Build all 3 Docker images
   - Verify they build without errors
   - (No push for now — that's for deployment phase)

Also create:
- /.github/workflows/pr-check.yml: runs on PR, adds comment with test results summary
- /backend/.eslintrc.json: strict TypeScript ESLint config
- /frontend/.eslintrc.json: Next.js + TypeScript ESLint config  
- Root Makefile with shortcuts:
  make dev    → docker-compose up
  make test   → run all tests
  make migrate → run prisma migrate dev
  make seed   → run prisma db seed
  make lint   → lint all services
```

---

## FAZA 11 — POLISH & FINAL

### Prompt 11.1 — Landing Page
```
Build a professional landing page at / (public):

Hero section:
- Large headline: "Learn Without Limits" 
- Subheadline describing ZK-LMS
- Two CTAs: "Start Learning" (→ /register) and "Teach on ZK-LMS" (→ /register?role=instructor)
- Hero image/illustration: abstract learning/education themed SVG

Features section (3 columns):
- AI-Powered Quizzes (brain icon)
- Live Sessions (video icon)  
- Track Your Progress (chart icon)
Each with icon, title, description

Stats bar: "X+ Courses | Y+ Students | Z+ Instructors" (fetch real counts from GET /api/stats)

Featured Courses section:
- 3 published courses (GET /api/courses?limit=3&sort=enrollmentCount)
- Course cards with thumbnail, title, instructor, rating, enrollment count, "Enroll" button

How it works section (3 steps with numbered circles):
1. Create Account
2. Enroll in Courses  
3. Learn & Get Certified

Footer: logo, links (About, Courses, Contact), social links

Design requirements:
- Fully responsive (mobile → desktop)
- Smooth scroll animations (use framer-motion for fade-in on scroll)
- Indigo gradient accents
- Professional, clean — NOT basic
Install: npm install framer-motion
```

---

### Prompt 11.2 — Error Handling & Loading States
```
Add production-quality error handling and loading states throughout the app:

1. Global error boundary (/frontend/src/app/error.tsx):
   - Catches React errors, shows friendly error page
   - "Try again" button, "Go home" link

2. API error handling in Zustand/React Query:
   - Create /frontend/src/lib/api.ts: axios instance with interceptors
     - Request: attach Authorization header automatically
     - Response: if 401 → clear auth store + redirect to login
     - Response: if 5xx → show toast notification
   - Use react-hot-toast for toast notifications (npm install react-hot-toast)

3. Loading skeletons for EVERY page that fetches data:
   - Use shadcn Skeleton component
   - Match the shape of the actual content (course cards, table rows, etc.)

4. Empty states for ALL lists/tables:
   - Courses: "No courses yet. Create your first one!"
   - Enrollments: "You haven't enrolled in any courses yet. Browse courses →"
   - Notifications: "You're all caught up! No new notifications."
   Each with a relevant icon and optional CTA button

5. Form validation feedback:
   - All forms show inline errors below each field (react-hook-form + zod)
   - Success toast after create/update operations
   - Confirm dialogs (shadcn AlertDialog) before destructive actions (delete, archive)

6. 404 page (/frontend/src/app/not-found.tsx):
   - Friendly message, illustration, "Go to Dashboard" button

7. Backend: Global error handler middleware
   - Catches all unhandled errors
   - Formats as { success: false, error: message, code: httpStatus }
   - Never leaks stack traces in production (check NODE_ENV)
   - Log errors with timestamp and request details
```

---

### Prompt 11.3 — Performance & SEO
```
Final optimizations before the project is complete:

Backend performance:
1. Add Redis caching for frequently accessed data:
   - GET /api/courses (public list): cache 5 minutes, invalidate on course publish
   - GET /api/courses/:slug (public detail): cache 10 minutes
   - GET /api/admin/stats: cache 1 hour
   Create /backend/src/lib/cache.ts with get/set/invalidate helpers

2. Add database indexes to Prisma schema:
   - User: @@index([email]), @@index([role])
   - Course: @@index([status]), @@index([instructorId]), @@index([slug])
   - Enrollment: @@index([studentId]), @@index([courseId])
   - Notification: @@index([userId, isRead])
   - LessonProgress: @@index([enrollmentId])
   Run: npx prisma migrate dev --name add-indexes

3. API pagination: ensure ALL list endpoints support ?page=1&limit=20

Frontend performance:
4. Next.js Image component: replace all <img> tags with <Image> from next/image
5. Add loading.tsx files for all major routes (Next.js Suspense)
6. Dynamic imports for heavy components:
   - TipTap editor: dynamic(() => import('./Editor'), { ssr: false })
   - Recharts: dynamic(() => import('./Chart'), { ssr: false })
   - Puppeteer/PDF: already server-side only ✓

SEO (for public pages):
7. Add proper metadata to all public pages using Next.js Metadata API:
   - Landing page: title, description, og:image
   - Course detail page: dynamic title/description from course data
8. Add /robots.txt and /sitemap.xml (Next.js route handlers)

Run: npm run build in /frontend — fix ALL TypeScript and ESLint errors until build succeeds with 0 warnings.
Final check: npm run lint in /backend — fix all issues.
```

---

## KOMANDAT E DOBISHME GJATE GJITHE ZHVILLIMIT

### Kur has nje bug:
```
I have a bug: [pershkruaj saktesisht cfare ndodh]
Error message: [kopjo error-in e plote]
File: [emri skedarit]
Expected behavior: [cfare duhet te ndodhe]
Please fix it without changing the architecture.
```

### Kur duhet te shtosh nje feature te vogel:
```
Add [feature] to [component/page].
Follow the existing patterns in this codebase.
Do not change any other files.
```

### Kur diçka nuk perputhet me stack-un:
```
Remember our stack from CLAUDE.md: we use [teknologjia e sakte].
Please redo this using [teknologjia] instead of [cfare perdori].
```

### Per code review perpara mbrojtjes:
```
Review the entire codebase for:
1. Security issues (exposed secrets, missing auth checks, SQL injection risks)
2. TypeScript errors or 'any' types that should be typed
3. Missing error handling in async functions
4. Inconsistent patterns vs what's defined in CLAUDE.md
5. Performance issues (N+1 queries, missing indexes, large bundle imports)
Provide a prioritized list of issues to fix.
```

### Per dokumentim akademik:
```
Generate API documentation in OpenAPI 3.0 format for all backend routes.
Save to /docs/api-spec.yaml
Then generate a human-readable summary of all endpoints organized by feature,
save to /docs/API.md — this will be included in the diploma thesis appendix.
```

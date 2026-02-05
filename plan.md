# Examination Evaluation Bureau – Grade 5 Scholarship Exam Platform (Plan)

## 1) Objectives (North Star)
- Deliver a monthly digital exam system for Grades 2–5 (ages 7–11) focused on Sri Lanka Grade 5 scholarship preparation.
- Paper 1: 60 MCQs (5 options, 1 correct), 1-hour timer, randomized order, auto-graded, mapped to 10 skills.
- Paper 2: 1 essay + 10 short answers submitted via WhatsApp (outside app); teachers upload marks + optional photos, and comments.
- Track 10 skills (Math Reasoning, Language, General Knowledge, Comprehension, Problem Solving, Logical Thinking, Spatial Reasoning, Memory & Recall, Analytical, Critical Thinking) per exam and month-on-month.
- Provide blood-report–style progress dashboard for parents (line graphs across 10 skills, monthly trends, strengths/weaknesses).
- Roles: Student, Parent, Teacher/Educator, Admin; Educators create/upload exams and map questions to skills; Admin manages system.
- Tech: FastAPI + MongoDB + React (reuse FARM foundation from TecaiKids).

---

## 2) Phased Implementation (POC Decision + App Build)

### Phase 1: Core Flow POC (Skipped – build directly)
Rationale: Core flows are internal (MCQ engine, timing, auto-grade, skill mapping, basic auth) and do not require external integrations. We will implement directly with rapid smoke tests.

Smoke-Test User Stories (to validate core early during dev):
1. As a student, I can start a timed 60-question MCQ exam and see a countdown.
2. As a student, I can submit Paper 1 and immediately see total score and per-skill breakdown.
3. As a teacher, I can create an MCQ exam, upload questions, and tag each question to one of the 10 skills.
4. As an admin, I can create monthly exam schedules for grades 2–5.
5. As a parent, I can open my child’s profile and see a sample monthly line graph for the 10 skills.

Exit Criteria (go/no-go to Phase 2):
- Timer works; answers captured; auto-grading correct; per-skill aggregation stored; basic charts render from stored attempts.

### Phase 2: Main App Development (Comprehensive)
Backend (FastAPI + MongoDB):
- Models/Collections: Users (roles), Students, Parents, Teachers, Exams, Questions, QuestionOptions, ExamSchedule, Attempts (Paper 1), Paper2Submissions (meta + teacher marks + media refs), SkillScores (aggregates), Grades (2–5).
- Endpoints:
  - Auth (simple JWT): login/register for Teacher/Admin; student/parent linking.
  - Exams: CRUD exams (grade, month), publish/unpublish, question banks import (CSV/JSON), question skill mapping, randomization seed.
  - Paper 1: start exam (issue attempt token + timer), submit responses, auto-grade, compute skill scores, store attempt + per-skill.
  - Paper 2: store submission metadata (WhatsApp path or manual note), teacher enters marks per rubric, store per-skill deltas.
  - Results: per attempt summary, monthly aggregates, per-skill timeseries, export (CSV/JSON).
  - Dashboard: student profile graph (10 skills × months), strengths/weaknesses, teacher cohort analytics.
- Services/Logic:
  - Auto-grader (single-correct MCQ, 5 options), negative marking toggle (off by default).
  - Skill aggregator: per question → skill mapping → monthly skill score and trend lines.
  - Scheduler: monthly exam creation templates per grade.
  - Access control (role-based); rate limits (basic) for submissions.

Frontend (React):
- Routes: /login, /dashboard (student/parent/teacher/admin), /exams, /exam/:id (MCQ engine), /results/:studentId, /admin/exams, /teacher/marking, /reports.
- Components:
  - MCQ Exam Engine: 60 questions, 5 options, single select, next/prev, flag, timer, autosave.
  - Exam Builder (Teacher): upload questions (CSV/JSON), map skill tags, preview, publish.
  - Paper 2 Marking: enter essay + 10 short-answer marks; attach WhatsApp image URLs/files; comments; save.
  - Student Dashboard: current score, per-skill radar + line charts (month-on-month), strengths/weaknesses cards.
  - Parent View: child’s longitudinal graph (10 skills), monthly report summary.
  - Admin: exam schedule, grades 2–5 management, user roles, data export.
- Charts: Recharts (or Chart.js) line chart for 10 skills × months; radar chart for snapshot.
- UX Details: Mobile-friendly exam UI, clear timer state, confirm before submit, disabled back navigation on exam, accessible colors.

Data/Scoring:
- Paper 1: each question tagged to exactly one of the 10 skills; score per skill = sum of points for that skill; monthly aggregate across exams.
- Paper 2: teacher enters marks per rubric; optionally map to skill components (weights) that contribute to monthly per-skill trend.

User Stories (Phase 2 – at least 10):
1. As a student, I can resume an in-progress MCQ attempt if my network drops within the 1-hour window.
2. As a student, I can see my auto-graded score and which skills need improvement.
3. As a parent, I can see a month-on-month line graph across 10 skills for my child.
4. As a parent, I can download a monthly “blood-report–style” PDF summary (optional if time permits in v1).
5. As a teacher, I can upload MCQ questions (CSV/JSON), map skill tags, and publish an exam for Grade 5.
6. As a teacher, I can enter Paper 2 marks and attach WhatsApp submission screenshots for archiving.
7. As a teacher, I can view cohort analytics (average per-skill trends for a class/grade).
8. As an admin, I can configure monthly exams for grades 2–5 and lock/unlock exam windows.
9. As an admin, I can export results (CSV) for finance/reporting purposes.
10. As an admin, I can manage user roles (teacher/parent/student) and link students to parents.

Testing (end of Phase 2):
- Call testing agent to simulate: exam start → submit → score; question import; teacher marking; parent graph view; role access checks; mobile exam flow.

### Phase 3: Enhancements (Post-MVP)
- Optional WhatsApp Integration (Meta/Twilio API) to auto-fetch Paper 2 photos and attach to submissions (POC needed then).
- Anti-cheating features (section locks, IP capture, randomized sections, optional proctor prompts).
- Question bank tagging improvements (difficulty levels, multi-skill weights).
- Notifications (email/SMS/WhatsApp) for schedules, results.
- Payments (if monetizing exams) and receipts.

---

## 3) Implementation Steps (Concise)
1. Backend scaffolding: models, auth, exams, questions, attempts, skill mapping; implement auto-grader + timer state.
2. Frontend exam engine (MCQ), timer, navigation, submit → auto-grade → results.
3. Teacher exam builder: upload questions + skill tags; publish per grade/month.
4. Paper 2 workflow: submission metadata + teacher marks form + attachments; aggregate to skill scores.
5. Student/Parent dashboards: 10-skill line graphs, radar snapshot, strengths/weaknesses.
6. Admin: schedules, roles, exports.
7. QA: end-to-end testing agent run; fix; polish; accessibility.

---

## 4) Next Actions (Immediate)
- Confirm final list of 10 skills per Examination Dept. (Educators can supply per exam or confirm defaults above).
- Provide sample MCQ CSV/JSON template and 1 month of sample exams for Grade 5 to seed.
- Provide branding (logo, colors) for EEB.
- Decide if Paper 2 attachments will be uploaded or only links to WhatsApp images.
- Start Phase 2 build (since POC skipped).

---

## 5) Success Criteria
- Students in Grades 2–5 can complete the monthly Paper 1 exam (60 MCQ, 1 hour) and see immediate auto-graded results with per-skill breakdown.
- Teachers can create/upload exams, map questions to 10 skills, and enter Paper 2 marks with attachments.
- Parents can view a “blood-report–style” trend graph across 10 skills (at least 6 months simulated/sample) and identify strengths/weaknesses.
- Admin can schedule exams per grade, manage roles, and export results.
- Data integrity: all attempts, marks, and aggregates persist reliably; charts reflect accurate monthly trends.

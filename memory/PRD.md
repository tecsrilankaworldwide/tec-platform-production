# TecaiKids Platform - Product Requirements Document

## Overview
**Product**: TEC Future-Ready Learning Platform (www.tecaikids.com)
**Operator**: TEC Sri Lanka Worldwide (Pvt.) Ltd
**Established**: 1982 (42 Years of Educational Excellence)
**Target**: Children ages 4-18 across multiple countries

## Core Requirements

### User Personas
1. **Students** (Ages 4-18) - Learning, progress tracking, ID cards
2. **Parents** - Enrollment, payment, child progress monitoring
3. **Teachers** - Course creation, student management, attendance tracking
4. **Admins** - Platform management, finance, payroll

### Multi-Language Support
10 Languages: English, Sinhala, Tamil, Hindi, Bengali, Malay, Indonesian, Arabic, Urdu, Chinese

### Age Groups & Programs
| Group | Ages | Level Name | Code |
|-------|------|------------|------|
| Foundation | 4-6 | Little Learners | F |
| Explorers | 7-9 | Young Explorers | E |
| Smart | 10-12 | Smart Kids | S |
| Teens | 13-15 | Tech Teens | T |
| Leaders | 16-18 | Future Leaders | L |

---

## What's Been Implemented

### Date: January 31, 2026

#### 1. Student Index System ✅
- Format: `{COUNTRY}-{GROUP}-{NUMBER}` (e.g., SRI-F-1001)
- Auto-detects country from language selection
- Starts from 1001 to hide actual student count
- Supported countries: SRI, IND, MAL, BAN, PAK, IDN, SGP, UAE, SAU, INT

#### 2. Admin Dashboard ✅
- Overview stats (students, teachers, courses, revenue)
- Student management with search/filter
- Teacher management
- Payment history
- Link to Attendance Manager

#### 3. Finance Management by Country ✅
- Income tracking by country
- Expense tracking by country
- Payroll management (max 25 workers per country)
- Financial summary with net profit per country

#### 4. Student Dashboard ✅
- XP, level, badges, streak display
- Skill progress tracking
- Digital ID Card
- Photo/Initials/Avatar options
- Auto-recommends photo alternatives for Saudi, UAE, Pakistan

#### 5. QR Code + Live Verification System ✅
- QR code on ID cards
- Public verification page at /verify/{student_index}
- Shows: ACTIVE/EXPIRED/INACTIVE status
- No authentication required for verification
- Includes: student details, organization info, timestamp

#### 6. NFC Tap-to-Verify System ✅
- Short URL for NFC tags: /v/{student_index}
- NFC data endpoint with setup instructions
- Recommended tag: NTAG213 (~$0.15)
- Free app recommendations (NFC Tools, TagWriter)
- Complete setup guide in Student Dashboard

#### 7. Parent Portal ✅ (NEW - Jan 31, 2026)
- Link children using Student ID (e.g., SRI-F-1001)
- View linked child's progress, badges, streaks, XP
- Tabs: Overview, Attendance, Certificates, Payments
- View attendance records with rate calculation
- View/download certificates
- View payment history
- Unlink child option

#### 8. Attendance System ✅ (NEW - Jan 31, 2026)
- Create class sessions (title, date, time, age group, Zoom link)
- View session list with status (scheduled/in_progress/completed)
- Mark attendance: Present, Late, Absent
- Bulk attendance marking
- Attendance summary per session
- Student attendance reports

#### 9. Certificate PDF Generation ✅ (NEW - Jan 31, 2026)
- Generate professional certificates
- Unique certificate number (e.g., TEC-20260131-E1449CB7)
- Certificate types: Completion, Achievement, Participation
- Download as PDF
- Public verification by certificate number
- Parent can view child's certificates

#### 10. Teacher Certificate Issuance UI ✅ (NEW - Jan 31, 2026)
- Search students by name, ID, or email
- Filter by age group
- Select multiple students (or select all)
- Choose certificate type: Completion, Achievement, Participation, Excellence
- Enter course/program name
- Bulk issue certificates to selected students
- View recently issued certificates
- Quick stats dashboard

#### 11. Gamification Level System ✅ (NEW - Jan 31, 2026)
- 7 learning levels: Beginner Explorer → Master Explorer
- XP-based progression with clear requirements
- Skill trees in 3 areas: AI & Technology, Logic & Thinking, Creative & Innovation
- Level-specific skills unlock as students progress
- Rewards and badges at each level
- Visual roadmap showing all levels
- "My Progress" tab with current skills
- "All Levels" tab with complete roadmap
- "Skill Tree" tab with 3-column skill visualization

#### 12. Student Showcase ✅ (NEW - Jan 31, 2026)
- Students can upload and share their work
- Categories: Art & Drawing, Projects, Coding, Creative Writing, Science
- Filter by level and category
- Like and comment on work
- Featured section for outstanding work
- Gallery view with student info and level badges
- "My Work" tab for personal uploads
- Level badge displayed on each work item

#### 13. Certificate Email Notifications ✅ (NEW - Jan 31, 2026)
- Automatic email when certificate is issued
- Beautiful HTML email with certificate details
- Download link included in email
- Emails sent to both student AND linked parent(s)
- Uses Resend email service

#### 14. Enhanced PDF Certificates ✅ (NEW - Jan 31, 2026)
- TEC logo included at top
- "SCIENTIA PRO HOMINIUS" motto
- Gold and purple design theme
- Official TEC seal/badge
- Corner decorations
- Footer with verification URL

#### 15. Tech & AI Magazine ✅ (NEW - Jan 31, 2026)
- 5 age-specific magazines:
  - 🌟 Little Learners Monthly (4-6 yrs)
  - 🔭 Young Explorers Digest (7-9 yrs)
  - 💡 Smart Kids Tech Times (10-12 yrs)
  - 🚀 Teen Tech Tribune (13-15 yrs)
  - 👑 Future Leaders Review (16-18 yrs)
- Monthly editions with current date
- Article categories: AI News, Tech Trends, Cool Inventions, Coding Corner, Student Stories, Global Tech
- Student Contributions section - articles visible to same age group across ALL countries
- Students can submit their own writeups
- Like and share functionality
- Featured articles section
- Editorial picks

#### 16. Class Scheduler ✅ (NEW - Jan 31, 2026)
- Week view calendar with navigation
- Schedule Zoom classes with full details
- Set age group, max students, duration
- Add Zoom link, meeting ID, password
- Send reminders via WhatsApp or Email
- View upcoming classes list
- Enroll students in classes
- Delete/manage classes

#### 17. Structured Article Editor ✅ (NEW - Jan 31, 2026)
- 6 article templates: Tech News, How-To Guide, My Story, App Review, Opinion, Project Showcase
- Structured form sections:
  - Title & Subtitle
  - Introduction (hook readers)
  - Main Content (detailed)
  - Key Points (3 bullet highlights)
  - Conclusion
  - Sources/References
- Article Settings: Category, Age Group, Tags, Cover Image
- Preview article before submit
- Save as draft or submit for review
- Track "My Articles" with status (Draft, Under Review, Published)
- Easy to publish with minimal editing!

#### 18. WhatsApp Reminders UI ✅ (NEW - Jan 31, 2026)
- Send automated notifications to parents via WhatsApp
- 4 notification templates:
  - Enrollment Confirmation
  - Welcome Message  
  - Class Reminder
  - Subscription Success
- Custom message option for personalized communication
- Phone number formatting with country code support
- Twilio WhatsApp integration (sandbox mode)
- Accessible to teachers/admins via navigation menu

#### Bug Fixes (Jan 31, 2026)
- Fixed "Invalid Date" display on student certificates page
- Fixed empty verification code display on certificates
- Added support for both `issued_date` and `completion_date` field formats
- Added support for both `course_name` and `course_title` field formats

#### 19. Teacher Article Review Dashboard ✅ (NEW - Jan 31, 2026)
- Dashboard showing pending student article submissions
- Filter tabs: Pending, Approved, Rejected
- Stats cards showing submission counts
- Review modal with:
  - Edit title and content before publishing
  - Add feedback for student
  - Approve & Publish or Reject actions
- Article details: author, age group, category, submission date
- Accessible to teachers/admins via "📝 Reviews" link

#### 20. Weekly/Monthly Leaderboard ✅ (NEW - Jan 31, 2026)
- Combined score ranking (XP + Badges + Streak + Likes + Articles)
- "My Rank" card showing current user's position
- Period tabs: Weekly, Monthly, All Time
- Age group filter dropdown
- Top 3 podium display with gold/silver/bronze medals
- Detailed ranking table with:
  - Student photo/initials
  - Level icon
  - XP, Badges count, Streak days
  - Combined score
- Score breakdown explanation panel
- Accessible to students and parents only

#### 21. Article Review Email Notifications ✅ (NEW - Jan 31, 2026)
- Automatic email when article is approved or rejected
- Beautiful HTML email templates:
  - 🎉 Green theme for approved articles
  - 📝 Amber theme for articles needing revision
- Includes reviewer feedback in the email
- Link to magazine for approved articles
- Encouraging messaging for both outcomes
- **Parent Notifications** for approved articles:
  - 🌟 Golden "Proud Parent Moment" email
  - Celebration messaging highlighting child's achievement
  - Encouragement to read and share the article
  - Sent automatically to all linked parents

---

## Verification Methods Summary

| Method | URL | Best For |
|--------|-----|----------|
| QR Code | /verify/{index} | Printed ID cards |
| NFC Tag | /v/{index} | Physical tap verification |
| Certificate | /api/certificates/verify/{number} | Certificate verification |

---

## Prioritized Backlog

### P0 (Critical) - COMPLETED ✅
- [x] Parent Portal (track child progress, payments)
- [x] Attendance System (Zoom class tracking)
- [x] Certificate PDF generation
- [x] Teacher Certificate Issuance UI

### P1 (High Priority) - COMPLETED ✅
- [x] Class scheduling system
- [x] WhatsApp class reminders UI
- [x] Teacher Article Review/Publishing Workflow
- [x] Weekly/Monthly Leaderboard

### P2 (Medium Priority)
- [ ] Referral system
- [ ] Free trial/demo class
- [ ] Social sharing for certificates

### P3 (Future)
- [ ] Mobile app
- [ ] Homework system
- [ ] Live video classes integration
- [ ] Teacher messaging from Parent Portal

---

## Technical Stack
- **Frontend**: React.js, Tailwind CSS, Lucide React icons
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payments**: PayPal (SANDBOX MODE)
- **QR Code**: qrcode library
- **PDF Generation**: reportlab, fpdf2
- **NFC**: NDEF URL records (NTAG213 compatible)

## Test Credentials
- **Admin**: admin@tecaikids.com / admin123
- **Parent**: parent.test@test.com / test123
- **Student (Sri Lanka)**: sri.foundation@test.com / test123
- **Student Index**: SRI-F-1001

## Routes
- `/` - Public Landing Page
- `/login` - Staff Login
- `/dashboard` - Main Dashboard
- `/admin` - Admin Dashboard
- `/student-dashboard` - Student Dashboard
- `/parent-portal` - Parent Portal (NEW)
- `/attendance` - Attendance Manager (NEW)
- `/teacher-certificates` - Teacher Certificate Issuance (NEW)
- `/my-learning` - Level-Based Learning Journey (NEW)
- `/showcase` - Student Showcase Gallery (NEW)
- `/magazine` - Tech & AI Magazine (NEW)
- `/class-scheduler` - Class Scheduling (NEW)
- `/write-article` - Article Editor (NEW)
- `/whatsapp-admin` - WhatsApp Notifications (NEW)
- `/article-reviews` - Teacher Article Review Dashboard (NEW)
- `/leaderboard` - Student/Parent Leaderboard (NEW)
- `/certificates` - Student Certificates
- `/verify/:studentIndex` - Public Verification (full)
- `/v/:studentIndex` - Public Verification (short/NFC)

## Key API Endpoints

### Parent Portal
- `POST /api/parent/link-child` - Link child by student index
- `GET /api/parent/children` - Get linked children
- `GET /api/parent/child/{id}/progress` - Get child's progress
- `GET /api/parent/child/{id}/payments` - Get payment history
- `DELETE /api/parent/unlink-child/{linkId}` - Unlink child

### Attendance System
- `POST /api/attendance/class` - Create class session
- `GET /api/attendance/classes` - List sessions
- `GET /api/attendance/session/{id}` - Get session with attendance
- `POST /api/attendance/mark` - Mark single attendance
- `POST /api/attendance/mark-bulk` - Mark bulk attendance
- `GET /api/attendance/student/{id}/report` - Student report

### Certificates
- `POST /api/certificates/generate` - Generate certificate
- `GET /api/certificates/{id}/pdf` - Download PDF
- `GET /api/certificates/student/{id}` - List student certs
- `GET /api/certificates/verify/{number}` - Public verify

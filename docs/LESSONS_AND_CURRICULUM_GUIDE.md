# TEC Platform - How to Manage Lessons & Curriculum PDFs

## 📚 How to Add Lessons (Videos) to Courses

### Step 1: Login as Teacher/Admin
1. Go to the platform and login with a teacher or admin account
2. Navigate to **Dashboard** → **Create Content** (in navigation)

### Step 2: Create a Course (if needed)
1. Click **"Create New Course"** button
2. Fill in the course details:
   - **Title**: e.g., "Introduction to AI for Kids"
   - **Description**: Brief overview of what students will learn
   - **Learning Level**: Foundation (5-8), Development (9-12), or Mastery (13-16)
   - **Age Group**: Select target age group
   - **Skill Areas**: AI Literacy, Logical Thinking, Creative Problem Solving, etc.
   - **Difficulty Level**: 1-5 (1=easiest)
   - **Estimated Hours**: How long to complete
   - **Premium**: Toggle if this is premium content
3. Click **"Create Course"**

### Step 3: Upload Video Lessons
1. Select the course from the dropdown
2. Fill in lesson details:
   - **Title**: e.g., "What is Artificial Intelligence?"
   - **Description**: What this lesson covers
3. Click **"Choose Video"** and select your video file (MP4, WebM, MOV supported)
4. Click **"Upload Lesson"**
5. Wait for upload to complete (progress bar shows status)
6. Repeat for additional lessons

### API Endpoint (for developers):
```bash
POST /api/courses/{course_id}/videos
Content-Type: multipart/form-data

video: [file]
title: "Lesson Title"
description: "Lesson description"
```

---

## 📄 How to Generate Curriculum PDFs for Parents

### Option 1: Using the Teacher Dashboard

1. Login as Teacher/Admin
2. Navigate to **Teacher** section
3. Look for **"Generate Curriculum PDF"** button (if added to UI)
4. Select options:
   - Course (optional)
   - Include lessons list
   - Include schedule
   - Include objectives
   - Add custom sections
5. Click **"Generate PDF"**
6. PDF will download automatically

### Option 2: Using API directly

```bash
# Generate curriculum PDF for a specific course
curl -X POST "https://YOUR_URL/api/curriculum/generate-pdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": "course-uuid-here",
    "title": "AI Course Curriculum",
    "include_lessons": true,
    "include_schedule": true,
    "include_objectives": true,
    "custom_sections": [
      {"title": "Weekly Schedule", "content": "Monday: AI Basics, Wednesday: Hands-on Projects"},
      {"title": "Parent Involvement", "content": "Encourage your child to share what they learned"}
    ]
  }' \
  --output curriculum.pdf
```

### Option 3: Using Pre-built Parent Guides

The platform has pre-built parent guides for each age group:

1. **Foundation** (Ages 5-8): `/api/parent-guides/foundation/en`
2. **Explorers** (Ages 7-9): `/api/parent-guides/explorers/en`
3. **Smart Kids** (Ages 10-12): `/api/parent-guides/smart/en`
4. **Teens** (Ages 13-15): `/api/parent-guides/teens/en`
5. **Leaders** (Ages 16-18): `/api/parent-guides/leaders/en`

**Supported Languages**: en, si (Sinhala), ta (Tamil), zh-CN (Chinese), id (Indonesian), ar (Arabic), hi (Hindi), ms (Malay), bn (Bengali), ur (Urdu)

Example URL: `https://YOUR_URL/api/parent-guides/foundation/si` (Foundation guide in Sinhala)

---

## 🔄 Do You Need to Re-upload After Changes?

### NO Re-upload Needed For:
- Adding lessons/videos (stored in database)
- Creating courses (stored in database)
- Generating PDFs (generated on-the-fly)
- Student progress (stored in database)
- User accounts (stored in database)

### YES Re-upload Needed For:
- Code changes (new features, bug fixes)
- Frontend UI changes
- Backend API changes
- New integrations

### How to Deploy Changes:
1. **From Emergent Platform**: Click "Deploy" to push your changes live
2. **To GitHub**: Use "Save to GitHub" feature in chat
3. **To Your Server**: Download code and deploy manually

---

## Quick Reference: API Endpoints

### Lessons/Videos
| Action | Method | Endpoint |
|--------|--------|----------|
| Upload video | POST | `/api/courses/{course_id}/videos` |
| Get course videos | GET | `/api/courses/{course_id}/videos` |
| Delete video | DELETE | `/api/courses/{course_id}/videos/{video_id}` |

### Courses
| Action | Method | Endpoint |
|--------|--------|----------|
| Create course | POST | `/api/courses` |
| Get all courses | GET | `/api/courses` |
| Get course details | GET | `/api/courses/{course_id}` |

### PDFs
| Action | Method | Endpoint |
|--------|--------|----------|
| Generate curriculum PDF | POST | `/api/curriculum/generate-pdf` |
| Get parent guide | GET | `/api/parent-guides/{age_group}/{language}` |
| Download certificate | GET | `/api/certificates/{cert_id}/download` |

---

## Need Help?

If you need to:
1. **Add a frontend UI for curriculum generation**: Ask and I'll create it
2. **Customize the PDF template**: Ask and I'll modify the design
3. **Add more languages**: Ask and I'll add translation support
4. **Bulk upload lessons**: Ask and I'll add batch upload feature

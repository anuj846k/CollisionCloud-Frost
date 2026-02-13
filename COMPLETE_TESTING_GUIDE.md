# 🧪 Complete Testing Guide - End-to-End Flow

This guide provides a complete step-by-step plan to test the entire accident analysis system from backend to frontend.

---

## 📋 Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Backend Routes & API Testing](#backend-routes--api-testing)
3. [Kestra Workflow Implementation](#kestra-workflow-implementation)
4. [Frontend UI Flow](#frontend-ui-flow)
5. [Complete Testing Sequence](#complete-testing-sequence)

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE SYSTEM FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. USER → Frontend → Upload Video → Backend API               │
│     POST /api/v1/projects/{id}/upload-video                    │
│     ↓                                                           │
│  2. Backend → Cloudinary → Store Video → Update Project         │
│     ↓                                                           │
│  3. User → Frontend → Start Processing → Backend API           │
│     POST /api/v1/processing/start                               │
│     ↓                                                           │
│  4. Backend → YOLO Detection → ByteTrack → Save Detections     │
│     ↓                                                           │
│  5. User → Frontend → Trigger Kestra Analysis → Backend API    │
│     POST /api/v1/kestra/trigger-analysis                        │
│     ↓                                                           │
│  6. Backend → Kestra Workflow → AI Analysis → Save Summary     │
│     ↓                                                           │
│  7. Frontend → Display Results (Timeline, AI Summary, etc.)    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Backend Routes & API Testing

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
All routes (except signup/login) require Bearer token:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Route Map

#### 1. Authentication Routes
```
POST   /signup                    - Register new user
POST   /login/access-token        - Login & get JWT token
```

#### 2. Project Routes
```
GET    /projects/                 - List all projects
POST   /projects/                 - Create new project
GET    /projects/{id}             - Get project details
PATCH  /projects/{id}              - Update project
DELETE /projects/{id}              - Delete project
POST   /projects/{id}/upload-video - Upload video file ⭐
```

#### 3. Processing Routes
```
POST   /processing/start           - Start video processing ⭐
GET    /processing/status/{run_id} - Get processing status
GET    /processing/project/{id}/stats - Get processing statistics
```

#### 4. Analysis Routes
```
GET    /analysis/project/{id}/collisions - Get collision analysis ⭐
GET    /analysis/project/{id}/track/{id}/trajectory - Get track trajectory
```

#### 5. Homography (Calibration) Routes
```
POST   /homography/project/{id}/session - Create/get session
PUT    /homography/session/{id}/pairs  - Update calibration points
POST   /homography/session/{id}/solve  - Solve homography matrix
```

#### 6. Kestra Routes ⭐⭐⭐
```
POST   /kestra/trigger-analysis    - Trigger Kestra workflow
GET    /kestra/project/{id}/status - Get workflow status
GET    /kestra/project/{id}/collision-data - Get collision data for AI
GET    /kestra/project/{id}/collision-screenshot - Get collision frame
POST   /kestra/project/{id}/save-summary - Save AI summary (called by Kestra)
GET    /kestra/project/{id}/summaries - List all AI summaries
GET    /kestra/project/{id}/summary/{id} - Get specific summary
```

---

## 🎬 Step-by-Step Testing Sequence

### Phase 1: Setup & Authentication

#### Step 1.1: Start Backend Server
```bash
cd wemakedevs/accident-backend
source venv/bin/activate  # or your virtual env
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

#### Step 1.2: Register User
```bash
curl -X POST http://localhost:8000/api/v1/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

**Save the response** - you'll get user ID.

#### Step 1.3: Login & Get Token
```bash
curl -X POST http://localhost:8000/api/v1/login/access-token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=password123"
```

**Save the `access_token`** - you'll need it for all subsequent requests.

**Example Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

### Phase 2: Project Creation & Video Upload

#### Step 2.1: Create Project
```bash
export TOKEN="your_access_token_here"

curl -X POST http://localhost:8000/api/v1/projects/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Accident Analysis",
    "description": "Testing complete flow"
  }'
```

**Save the `id`** from response - this is your `PROJECT_ID`.

**Example Response:**
```json
{
  "id": "e232695e-08fb-44e1-a38d-5f6bf481d93c",
  "user_id": "cb27426c-f471-4c8a-b54b-52c83fec6859",
  "title": "Test Accident Analysis",
  "status": "draft",
  "created_at": "2025-01-14T10:00:00Z"
}
```

#### Step 2.2: Upload Video ⭐
```bash
export PROJECT_ID="your_project_id_here"

curl -X POST "http://localhost:8000/api/v1/projects/$PROJECT_ID/upload-video" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/video.mp4"
```

**Important Notes:**
- Video must be a valid video file (mp4, mov, etc.)
- Video is uploaded to Cloudinary
- Project `video_path` is updated automatically
- Project status changes to `uploaded`

**Expected Response:**
```json
{
  "id": "media-asset-uuid",
  "project_id": "e232695e-08fb-44e1-a38d-5f6bf481d93c",
  "uri": "https://res.cloudinary.com/.../video.mp4",
  "kind": "video",
  "created_at": "2025-01-14T10:05:00Z"
}
```

**Verify:**
```bash
curl -X GET "http://localhost:8000/api/v1/projects/$PROJECT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

Check that `video_path` is populated.

---

### Phase 3: Video Processing

#### Step 3.1: Start Processing ⭐
```bash
curl -X POST http://localhost:8000/api/v1/processing/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": \"$PROJECT_ID\"
  }"
```

**Expected Response:**
```json
{
  "run_id": "run-uuid-here",
  "status": "started",
  "message": "Processing started"
}
```

**Save the `run_id`** for status checking.

#### Step 3.2: Check Processing Status
```bash
export RUN_ID="your_run_id_here"

curl -X GET "http://localhost:8000/api/v1/processing/status/$RUN_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Poll this endpoint** until `status` is `"completed"`:

```json
{
  "run_id": "run-uuid",
  "status": "completed",
  "total_frames": 150,
  "processed_frames": 150,
  "detection_count": 1250,
  "unique_tracks": 8
}
```

**Processing Time:** Usually 1-5 minutes depending on video length.

#### Step 3.3: Verify Detections
```bash
curl -X GET "http://localhost:8000/api/v1/processing/project/$PROJECT_ID/stats" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "total_detections": 1250,
  "total_frames": 150,
  "unique_tracks": 8,
  "processing_runs": 1
}
```

---

### Phase 4: Collision Analysis

#### Step 4.1: Get Collision Data ⭐
```bash
curl -X GET "http://localhost:8000/api/v1/analysis/project/$PROJECT_ID/collisions" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "project_id": "e232695e-08fb-44e1-a38d-5f6bf481d93c",
  "collisions": [
    {
      "track_id_1": 1,
      "track_id_2": 7,
      "first_contact_frame": 55,
      "peak_overlap_frame": 65,
      "last_overlap_frame": 75,
      "max_iou": 0.45,
      "severity": "moderate",
      "key_frames": {
        "approach": 40,
        "contact": 55,
        "peak": 65,
        "separation": 75
      }
    }
  ],
  "total_collisions": 1
}
```

**This data is used by:**
- Timeline component (frontend)
- Kestra workflow (AI analysis)

---

### Phase 5: Kestra Workflow ⭐⭐⭐

#### Step 5.1: Trigger Kestra Analysis
```bash
curl -X POST http://localhost:8000/api/v1/kestra/trigger-analysis \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": \"$PROJECT_ID\"
  }"
```

**Expected Response:**
```json
{
  "project_id": "e232695e-08fb-44e1-a38d-5f6bf481d93c",
  "status": "triggered",
  "message": "Kestra workflow triggered successfully"
}
```

#### Step 5.2: Check Workflow Status
```bash
curl -X GET "http://localhost:8000/api/v1/kestra/project/$PROJECT_ID/status" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "project_id": "e232695e-08fb-44e1-a38d-5f6bf481d93c",
  "project_status": "completed",
  "has_video": true,
  "processing_status": "completed",
  "detection_count": 1250,
  "collision_count": 1,
  "has_ai_summary": true,
  "latest_summary_id": "summary-uuid"
}
```

#### Step 5.3: Get AI Summaries
```bash
curl -X GET "http://localhost:8000/api/v1/kestra/project/$PROJECT_ID/summaries" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
[
  {
    "id": "summary-uuid",
    "project_id": "e232695e-08fb-44e1-a38d-5f6bf481d93c",
    "summary_text": "## Accident Analysis Report\n\n### Executive Summary\n...",
    "severity_assessment": "**Severity:** Moderate",
    "recommendations": "1. Review traffic patterns...",
    "ai_model": "gemini-2.5-flash",
    "created_at": "2025-01-14T10:30:00Z"
  }
]
```

---

## 🔄 Kestra Workflow Implementation

### Workflow File Location
```
wemakedevs/accident-backend/kestra/workflows/accident-analysis.yaml
```

### Workflow Steps

1. **Check Project Status**
   - GET `/api/v1/kestra/project/{id}/status`
   - Validates project has video and processing is complete

2. **Get Collision Data**
   - GET `/api/v1/kestra/project/{id}/collision-data`
   - Retrieves collision analysis for AI

3. **Get Collision Screenshot**
   - GET `/api/v1/kestra/project/{id}/collision-screenshot?frame={frame}`
   - Extracts frame from video at collision moment

4. **AI Analysis (Google Gemini)**
   - Calls Gemini API with collision data
   - Generates comprehensive report

5. **Save AI Summary**
   - POST `/api/v1/kestra/project/{id}/save-summary`
   - Stores AI-generated summary in database

6. **Generate PDF Report** (optional)
   - Creates PDF with images and analysis

7. **Generate Audio Summaries** (optional)
   - English audio via ElevenLabs
   - Hindi audio via ElevenLabs

### Running Kestra Workflow

#### Option 1: Via Kestra UI
1. Open Kestra UI (usually `http://localhost:8080`)
2. Navigate to workflows
3. Find `accident-analysis-pipeline`
4. Click "Execute"
5. Provide inputs:
   - `project_id`: Your project UUID
   - `api_base_url`: `http://host.docker.internal:8000`
   - `auth_token`: Your JWT token

#### Option 2: Via API Call (from Backend)
The `/kestra/trigger-analysis` endpoint should trigger the workflow automatically if Kestra is configured.

---

## 🎨 Frontend UI Flow

### Route Structure

```
/                          → Home/Dashboard (list projects)
/login                     → Login page
/signup                    → Signup page
/dashboard                 → Project list
/incident/[incidentId]      → Incident detail page ⭐
```

### Frontend Components Flow

#### 1. Dashboard (`/dashboard` or `/`)
- Lists all projects
- Shows project status
- "View Details" button → `/incident/[id]`

#### 2. Incident Detail Page (`/incident/[incidentId]`) ⭐

**Left Column:**
- **Video Evidence** - Displays uploaded video
- **Calibration & Measurement** - Calibration setup
- **Processing Summary** - Processing status
- **Detection Statistics** - Detection counts

**Right Column:**
- **Collision Analysis** - Top collision details
- **Event Timeline** - Timeline component ⭐
- **AI Summary & Recommendations** - Markdown-rendered summary ⭐

#### 3. Key Frontend API Calls

```typescript
// Load project data
getProject(projectId)

// Load collisions
getProjectCollisions(projectId)

// Load AI summaries
getProjectSummaries(projectId)

// Load workflow status
getWorkflowStatus(projectId)

// Trigger Kestra analysis
triggerKestraAnalysis({ project_id: projectId })
```

---

## 🧪 Complete Testing Checklist

### ✅ Backend Testing

- [ ] **Authentication**
  - [ ] Register user
  - [ ] Login and get token
  - [ ] Verify token works

- [ ] **Project Management**
  - [ ] Create project
  - [ ] List projects
  - [ ] Get project details

- [ ] **Video Upload**
  - [ ] Upload video file
  - [ ] Verify video_path is set
  - [ ] Check video is accessible

- [ ] **Video Processing**
  - [ ] Start processing
  - [ ] Poll status until complete
  - [ ] Verify detections saved
  - [ ] Check processing stats

- [ ] **Collision Analysis**
  - [ ] Get collision data
  - [ ] Verify key_frames present
  - [ ] Check collision details

- [ ] **Kestra Integration**
  - [ ] Trigger workflow
  - [ ] Check workflow status
  - [ ] Verify AI summary created
  - [ ] Get summaries list

### ✅ Frontend Testing

- [ ] **Navigation**
  - [ ] Login page works
  - [ ] Dashboard loads projects
  - [ ] Can navigate to incident page

- [ ] **Incident Page**
  - [ ] Video displays correctly
  - [ ] Timeline shows events
  - [ ] AI Summary renders markdown
  - [ ] Collision analysis displays
  - [ ] Processing status updates

- [ ] **Calibration** (Optional)
  - [ ] Can click on video frame
  - [ ] Points appear on video
  - [ ] Can enter GPS coordinates
  - [ ] Can save points
  - [ ] Can solve homography

---

## 🚀 Quick Start Testing Script

Save this as `test-flow.sh`:

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:8000/api/v1"
EMAIL="test@example.com"
PASSWORD="password123"
PROJECT_TITLE="Test Project"

echo "🧪 Starting Complete Test Flow..."

# 1. Register
echo "1. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"full_name\":\"Test User\"}")

echo "✅ Registered: $REGISTER_RESPONSE"

# 2. Login
echo "2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL&password=$PASSWORD")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
echo "✅ Logged in, token: ${TOKEN:0:20}..."

# 3. Create Project
echo "3. Creating project..."
PROJECT_RESPONSE=$(curl -s -X POST "$BASE_URL/projects/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"$PROJECT_TITLE\"}")

PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.id')
echo "✅ Project created: $PROJECT_ID"

# 4. Upload Video (if you have a video file)
if [ -f "test-video.mp4" ]; then
  echo "4. Uploading video..."
  UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/projects/$PROJECT_ID/upload-video" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@test-video.mp4")
  echo "✅ Video uploaded"
else
  echo "⚠️  Skipping video upload (test-video.mp4 not found)"
fi

# 5. Start Processing
echo "5. Starting processing..."
PROCESS_RESPONSE=$(curl -s -X POST "$BASE_URL/processing/start" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\":\"$PROJECT_ID\"}")

RUN_ID=$(echo $PROCESS_RESPONSE | jq -r '.run_id')
echo "✅ Processing started: $RUN_ID"

# 6. Check Status (poll until complete)
echo "6. Waiting for processing to complete..."
while true; do
  STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/processing/status/$RUN_ID" \
    -H "Authorization: Bearer $TOKEN")
  STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
  echo "   Status: $STATUS"
  if [ "$STATUS" = "completed" ]; then
    echo "✅ Processing complete!"
    break
  fi
  sleep 5
done

# 7. Get Collisions
echo "7. Getting collision data..."
COLLISIONS=$(curl -s -X GET "$BASE_URL/analysis/project/$PROJECT_ID/collisions" \
  -H "Authorization: Bearer $TOKEN")
echo "✅ Collisions: $(echo $COLLISIONS | jq '.total_collisions')"

# 8. Trigger Kestra
echo "8. Triggering Kestra analysis..."
KESTRA_RESPONSE=$(curl -s -X POST "$BASE_URL/kestra/trigger-analysis" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\":\"$PROJECT_ID\"}")
echo "✅ Kestra triggered: $(echo $KESTRA_RESPONSE | jq '.status')"

# 9. Get Summaries
echo "9. Getting AI summaries..."
SUMMARIES=$(curl -s -X GET "$BASE_URL/kestra/project/$PROJECT_ID/summaries" \
  -H "Authorization: Bearer $TOKEN")
echo "✅ Summaries: $(echo $SUMMARIES | jq 'length')"

echo ""
echo "🎉 Test flow complete!"
echo "📊 View results at: http://localhost:3000/incident/$PROJECT_ID"
```

**Make it executable:**
```bash
chmod +x test-flow.sh
./test-flow.sh
```

---

## 📝 Testing Notes

### Video Requirements
- Format: MP4, MOV, AVI (any video format)
- Duration: Recommended 5-10 seconds for testing
- Content: Should contain vehicles/cars for detection

### Expected Processing Times
- Video Upload: 5-30 seconds (depends on file size)
- Video Processing: 1-5 minutes (depends on video length)
- Kestra Workflow: 30 seconds - 2 minutes (AI analysis)

### Common Issues

1. **Video not displaying in frontend**
   - Check `video_path` is set in project
   - Verify Cloudinary URL is accessible
   - Check CORS settings

2. **Processing stuck**
   - Check backend logs
   - Verify YOLO model is loaded
   - Check database for detections

3. **Kestra workflow not triggering**
   - Verify Kestra is running
   - Check Kestra configuration
   - Verify API endpoints are accessible from Kestra

4. **AI Summary not appearing**
   - Check Kestra execution logs
   - Verify Gemini API key is set
   - Check `/kestra/project/{id}/summaries` endpoint

---

## 🎯 Next Steps After Testing

1. **Verify Timeline Component**
   - Check timeline shows APPROACH, CONTACT, PEAK, SEPARATION
   - Verify timestamps are correct
   - Check frame numbers match

2. **Verify AI Summary Rendering**
   - Check markdown renders correctly
   - Verify Severity section displays
   - Check Recommendations section

3. **Test Calibration** (if needed)
   - Click points on video
   - Enter GPS coordinates
   - Solve homography matrix

4. **Performance Testing**
   - Test with longer videos
   - Test with multiple projects
   - Check database query performance

---

## 📚 Additional Resources

- **Backend API Docs**: http://localhost:8000/docs
- **Kestra UI**: http://localhost:8080 (if running)
- **Frontend**: http://localhost:3000

---

**Happy Testing! 🚀**

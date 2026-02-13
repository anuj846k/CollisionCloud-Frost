# 🚀 API Routes Quick Reference

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication Header
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔐 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user |
| POST | `/login/access-token` | Login & get JWT token |

---

## 📁 Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/` | List all projects |
| POST | `/projects/` | Create new project |
| GET | `/projects/{id}` | Get project details |
| PATCH | `/projects/{id}` | Update project |
| DELETE | `/projects/{id}` | Delete project |
| **POST** | **`/projects/{id}/upload-video`** | **⭐ Upload video file** |

---

## ⚙️ Processing

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | **`/processing/start`** | **⭐ Start video processing** |
| GET | `/processing/status/{run_id}` | Get processing status |
| GET | `/processing/project/{id}/stats` | Get processing statistics |

---

## 🔍 Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | **`/analysis/project/{id}/collisions`** | **⭐ Get collision analysis** |
| GET | `/analysis/project/{id}/track/{id}/trajectory` | Get track trajectory |

---

## 📐 Calibration (Homography)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/homography/project/{id}/session` | Create/get session |
| PUT | `/homography/session/{id}/pairs` | Update calibration points |
| POST | `/homography/session/{id}/solve` | Solve homography matrix |

---

## 🤖 Kestra Workflow ⭐⭐⭐

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | **`/kestra/trigger-analysis`** | **⭐ Trigger Kestra workflow** |
| GET | `/kestra/project/{id}/status` | Get workflow status |
| GET | `/kestra/project/{id}/collision-data` | Get collision data for AI |
| GET | `/kestra/project/{id}/collision-screenshot` | Get collision frame screenshot |
| POST | `/kestra/project/{id}/save-summary` | Save AI summary (called by Kestra) |
| GET | `/kestra/project/{id}/summaries` | List all AI summaries |
| GET | `/kestra/project/{id}/summary/{id}` | Get specific summary |

---

## 📊 Complete Flow Sequence

```
1. POST /signup
   ↓
2. POST /login/access-token → Get TOKEN
   ↓
3. POST /projects/ → Get PROJECT_ID
   ↓
4. POST /projects/{PROJECT_ID}/upload-video → Upload video
   ↓
5. POST /processing/start → Get RUN_ID
   ↓
6. GET /processing/status/{RUN_ID} → Poll until "completed"
   ↓
7. GET /analysis/project/{PROJECT_ID}/collisions → Get collision data
   ↓
8. POST /kestra/trigger-analysis → Trigger AI workflow
   ↓
9. GET /kestra/project/{PROJECT_ID}/status → Check workflow status
   ↓
10. GET /kestra/project/{PROJECT_ID}/summaries → Get AI summaries
```

---

## 🎨 Frontend Routes

```
/                          → Dashboard (list projects)
/login                     → Login page
/signup                    → Signup page
/incident/[incidentId]     → Incident detail page ⭐
```

---

## 📝 Example cURL Commands

### 1. Login
```bash
curl -X POST http://localhost:8000/api/v1/login/access-token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=password123"
```

### 2. Create Project
```bash
curl -X POST http://localhost:8000/api/v1/projects/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Project"}'
```

### 3. Upload Video
```bash
curl -X POST "http://localhost:8000/api/v1/projects/$PROJECT_ID/upload-video" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@video.mp4"
```

### 4. Start Processing
```bash
curl -X POST http://localhost:8000/api/v1/processing/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\": \"$PROJECT_ID\"}"
```

### 5. Get Collisions
```bash
curl -X GET "http://localhost:8000/api/v1/analysis/project/$PROJECT_ID/collisions" \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Trigger Kestra
```bash
curl -X POST http://localhost:8000/api/v1/kestra/trigger-analysis \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\": \"$PROJECT_ID\"}"
```

### 7. Get AI Summaries
```bash
curl -X GET "http://localhost:8000/api/v1/kestra/project/$PROJECT_ID/summaries" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔗 Frontend API Functions

```typescript
// From src/lib/api.ts

// Projects
createProject(data)
getProjects()
getProject(id)
uploadVideo(projectId, file)

// Processing
startProcessing({ project_id })
getProcessingStatus(runId)
getProcessingStats(projectId)

// Analysis
getProjectCollisions(projectId)
getTrackTrajectory(projectId, trackId)

// Kestra
triggerKestraAnalysis({ project_id })
getWorkflowStatus(projectId)
getProjectSummaries(projectId)
getSummaryDetail(projectId, summaryId)

// Homography
getOrCreateHomographySession(projectId)
updateHomographyPairs(sessionId, pairs)
solveHomography(sessionId)
```

---

## 🎯 Key Endpoints for Testing

### Must Test (Core Flow)
1. ✅ `/projects/{id}/upload-video` - Video upload
2. ✅ `/processing/start` - Start processing
3. ✅ `/analysis/project/{id}/collisions` - Get collisions
4. ✅ `/kestra/trigger-analysis` - Trigger AI workflow
5. ✅ `/kestra/project/{id}/summaries` - Get AI summaries

### Frontend Display
- `/incident/[id]` - Main incident page
  - Shows video
  - Displays timeline
  - Renders AI summary (markdown)
  - Shows collision analysis

---

**Quick Start:** See `COMPLETE_TESTING_GUIDE.md` for detailed step-by-step instructions.

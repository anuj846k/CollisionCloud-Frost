// API utility functions for backend communication

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Token management
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

export const setAuthToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth_token", token);
};

export const removeAuthToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
};

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `API error: ${response.statusText}`);
  }

  return response.json();
}


// Auth API
export interface LoginRequest {
  username: string; // email
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const formData = new FormData();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/login/access-token`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Login failed");
  }

  return response.json();
};

export interface UserPublic {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name?: string;
}

export const signup = async (
  email: string,
  password: string,
  fullName?: string
): Promise<UserPublic> => {
  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      full_name: fullName || undefined,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Signup failed");
  }

  return response.json();
};

// Project API
export interface ProjectCreate {
  title: string;
  description?: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: string;
  video_path?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectsResponse {
  data: Project[];
  count: number;
}

export const createProject = async (
  project: ProjectCreate
): Promise<Project> => {
  return apiRequest<Project>("/projects/", {
    method: "POST",
    body: JSON.stringify(project),
  });
};

export const getProjects = async (): Promise<ProjectsResponse> => {
  return apiRequest<ProjectsResponse>("/projects/");
};

export const getProject = async (projectId: string): Promise<Project> => {
  return apiRequest<Project>(`/projects/${projectId}`);
};

// Media API
export interface MediaAsset {
  id: string;
  project_id: string;
  uri: string;
  kind: string;
  filename?: string;
  file_size?: number;
  content_type?: string;
  created_at: string;
}

export const uploadVideo = async (
  projectId: string,
  file: File
): Promise<MediaAsset> => {
  const formData = new FormData();
  formData.append("file", file);

  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/upload-video`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Upload failed");
  }

  return response.json();
};

export const updateProject = async (
  projectId: string,
  project: Partial<ProjectCreate>
): Promise<Project> => {
  return apiRequest<Project>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(project),
  });
};

export const deleteProject = async (
  projectId: string
): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>(`/projects/${projectId}`, {
    method: "DELETE",
  });
};

// Processing API
export interface StartProcessingRequest {
  project_id: string;
  config?: Record<string, any>;
}

export interface StartProcessingResponse {
  run_id: string;
  status: string;
  message: string;
}

export interface ProcessingStatusResponse {
  run_id: string;
  status: string;
  total_frames: number;
  processed_frames: number;
  detection_count: number;
  unique_tracks: number;
  error_message?: string;
}

export interface ProcessingStats {
  total_detections: number;
  total_frames: number;
  unique_tracks: number;
  processing_runs: number;
}

export const startProcessing = async (
  request: StartProcessingRequest
): Promise<StartProcessingResponse> => {
  return apiRequest<StartProcessingResponse>("/processing/start", {
    method: "POST",
    body: JSON.stringify(request),
  });
};

export const getProcessingStatus = async (
  runId: string
): Promise<ProcessingStatusResponse> => {
  return apiRequest<ProcessingStatusResponse>(`/processing/status/${runId}`);
};

export const getProcessingStats = async (
  projectId: string
): Promise<ProcessingStats> => {
  return apiRequest<ProcessingStats>(`/processing/project/${projectId}/stats`);
};

// Analysis API
export interface CollisionResponse {
  track_id_1: number;
  track_id_2: number;
  first_contact_frame: number;
  last_overlap_frame: number;
  peak_overlap_frame: number;
  max_iou: number;
  min_distance: number;
  duration_frames: number;
  collision_frames: number[];
  severity: string;
  key_frames: {
    approach?: number;
    contact?: number;
    peak?: number;
    separation?: number;
  };
}

export interface CollisionsListResponse {
  project_id: string;
  collisions: CollisionResponse[];
  near_misses: any[];
  total_collisions: number;
  total_near_misses: number;
  analysis_summary: Record<string, any>;
}

export interface TrajectoryPoint {
  frame_idx: number;
  timestamp_ms: number;
  center_x: number;
  center_y: number;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
  confidence: number;
}

export interface TrajectoryResponse {
  track_id: number;
  project_id: string;
  trajectory: TrajectoryPoint[];
  total_points: number;
}

export const getProjectCollisions = async (
  projectId: string,
  params?: {
    iou_threshold?: number;
    distance_threshold?: number;
    persistence_frames?: number;
    min_collision_frames?: number;
  }
): Promise<CollisionsListResponse> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }
  const query = queryParams.toString();
  return apiRequest<CollisionsListResponse>(
    `/analysis/project/${projectId}/collisions${query ? `?${query}` : ""}`
  );
};

export const getTrackTrajectory = async (
  projectId: string,
  trackId: number
): Promise<TrajectoryResponse> => {
  return apiRequest<TrajectoryResponse>(
    `/analysis/project/${projectId}/track/${trackId}/trajectory`
  );
};

// Homography API
export interface HomographyPair {
  image_x_norm: number;
  image_y_norm: number;
  map_lat: number;
  map_lng: number;
  order_idx?: number;
}

export interface HomographySession {
  id: string;
  project_id: string;
  status: string;
  created_at: string;
  solved_at?: string;
  pairs: Array<{
    id: string;
    image_x_norm: number;
    image_y_norm: number;
    map_lat: number;
    map_lng: number;
    order_idx: number;
  }>;
  matrix?: number[][];
  reprojection_error?: number;
}

export interface SolveResponse {
  success: boolean;
  matrix?: number[][];
  reprojection_error?: number;
  error_message?: string;
}

export const getOrCreateHomographySession = async (
  projectId: string
): Promise<HomographySession> => {
  return apiRequest<HomographySession>(
    `/homography/project/${projectId}/session`,
    {
      method: "POST",
    }
  );
};

export const updateHomographyPairs = async (
  sessionId: string,
  pairs: HomographyPair[]
): Promise<Array<HomographyPair & { id: string }>> => {
  return apiRequest<Array<HomographyPair & { id: string }>>(
    `/homography/session/${sessionId}/pairs`,
    {
      method: "PUT",
      body: JSON.stringify(pairs),
    }
  );
};

export const solveHomography = async (
  sessionId: string
): Promise<SolveResponse> => {
  return apiRequest<SolveResponse>(`/homography/session/${sessionId}/solve`, {
    method: "POST",
  });
};

// Kestra API
export interface TriggerWorkflowRequest {
  project_id: string;
}

export interface TriggerWorkflowResponse {
  project_id: string;
  status: string;
  message: string;
  processing_run_id?: string;
}

export interface CollisionDataResponse {
  project_id: string;
  has_collisions: boolean;
  collision_count: number;
  top_collision?: Record<string, any>;
  all_collisions: Array<Record<string, any>>;
  analysis_summary: Record<string, any>;
}

export interface WorkflowStatusResponse {
  project_id: string;
  project_status: string;
  has_video: boolean;
  processing_status?: string;
  processing_run_id?: string;
  detection_count: number;
  collision_count: number;
  has_ai_summary: boolean;
  latest_summary_id?: string;
}

export interface AISummary {
  id: string;
  project_id: string;
  summary_text: string;
  severity_assessment?: string;
  recommendations?: string;
  ai_model?: string;
  created_at: string;
}

export const triggerKestraAnalysis = async (
  request: TriggerWorkflowRequest
): Promise<TriggerWorkflowResponse> => {
  return apiRequest<TriggerWorkflowResponse>("/kestra/trigger-analysis", {
    method: "POST",
    body: JSON.stringify(request),
  });
};

export const getCollisionData = async (
  projectId: string
): Promise<CollisionDataResponse> => {
  return apiRequest<CollisionDataResponse>(
    `/kestra/project/${projectId}/collision-data`
  );
};

export const getWorkflowStatus = async (
  projectId: string
): Promise<WorkflowStatusResponse> => {
  return apiRequest<WorkflowStatusResponse>(
    `/kestra/project/${projectId}/status`
  );
};

export const getProjectSummaries = async (
  projectId: string,
  limit?: number
): Promise<AISummary[]> => {
  const query = limit ? `?limit=${limit}` : "";
  return apiRequest<AISummary[]>(
    `/kestra/project/${projectId}/summaries${query}`
  );
};

export const getSummaryDetail = async (
  projectId: string,
  summaryId: string
): Promise<AISummary> => {
  return apiRequest<AISummary>(
    `/kestra/project/${projectId}/summary/${summaryId}`
  );
};

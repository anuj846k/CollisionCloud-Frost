"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  getProject,
  getProjectCollisions,
  getProcessingStats,
  getWorkflowStatus,
  getProjectSummaries,
  getOrCreateHomographySession,
  startProcessing,
  getProcessingStatus,
  triggerKestraAnalysis,
  getAuthToken,
  type Project,
  type CollisionsListResponse,
  type ProcessingStats,
  type WorkflowStatusResponse,
  type AISummary,
  type HomographySession,
  type StartProcessingResponse,
  type ProcessingStatusResponse,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import CalibrationComponent from "@/components/CalibrationComponent";
import Timeline from "@/components/Timeline";

/* ------------------------------------------------------------------ */
/* UI HELPERS */
/* ------------------------------------------------------------------ */

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border rounded-lg p-4 space-y-3 bg-white">
    <h2 className="font-semibold text-base">{title}</h2>
    {children}
  </div>
);

const Badge = ({ text }: { text: string }) => (
  <span className="px-2 py-0.5 text-xs border rounded">{text}</span>
);

/* ------------------------------------------------------------------ */
/* INCIDENT PAGE */
/* ------------------------------------------------------------------ */

export default function IncidentPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.incidentId as string;

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [collisions, setCollisions] = useState<CollisionsListResponse | null>(null);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatusResponse | null>(null);
  const [aiSummaries, setAiSummaries] = useState<AISummary[]>([]);
  const [homographySession, setHomographySession] = useState<HomographySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingRunId, setProcessingRunId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusResponse | null>(null);
  const [showCalibration, setShowCalibration] = useState(false);

  // Load data on mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load project first
        const projectData = await getProject(projectId);
        setProject(projectData);

        // Load other data in parallel
        const [collisionsData, statsData, workflowData, summariesData] = await Promise.allSettled([
          getProjectCollisions(projectId),
          getProcessingStats(projectId),
          getWorkflowStatus(projectId),
          getProjectSummaries(projectId),
        ]);

        if (collisionsData.status === "fulfilled") {
          setCollisions(collisionsData.value);
        }
        if (statsData.status === "fulfilled") {
          setStats(statsData.value);
        }
        if (workflowData.status === "fulfilled") {
          setWorkflowStatus(workflowData.value);
        }
        if (summariesData.status === "fulfilled") {
          setAiSummaries(summariesData.value);
        }

        // Try to load homography session
        try {
          const session = await getOrCreateHomographySession(projectId);
          setHomographySession(session);
        } catch {
          // Homography session may not exist yet
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, router]);

  // Poll processing status when processing
  useEffect(() => {
    if (!processingRunId || !isProcessing) return;

    const pollStatus = async () => {
      try {
        const status = await getProcessingStatus(processingRunId);
        setProcessingStatus(status);

        if (status.status === "completed" || status.status === "failed") {
          setIsProcessing(false);
          // Reload data after processing completes
          if (status.status === "completed") {
            const [collisionsData, statsData, workflowData] = await Promise.allSettled([
              getProjectCollisions(projectId),
              getProcessingStats(projectId),
              getWorkflowStatus(projectId),
            ]);
            if (collisionsData.status === "fulfilled") setCollisions(collisionsData.value);
            if (statsData.status === "fulfilled") setStats(statsData.value);
            if (workflowData.status === "fulfilled") setWorkflowStatus(workflowData.value);
            
            // Reload project to get updated status
            const projectData = await getProject(projectId);
            setProject(projectData);
          }
        }
      } catch (err) {
        console.error("Failed to poll processing status:", err);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [processingRunId, isProcessing, projectId]);

  const handleStartProcessing = async () => {
    if (!project) return;
    try {
      setIsProcessing(true);
      setError(null);
      const response: StartProcessingResponse = await startProcessing({
        project_id: project.id,
      });
      setProcessingRunId(response.run_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start processing");
      setIsProcessing(false);
    }
  };

  const handleTriggerAnalysis = async () => {
    if (!project) return;
    try {
      setError(null);
      await triggerKestraAnalysis({ project_id: project.id });
      // Reload workflow status
      const workflowData = await getWorkflowStatus(project.id);
      setWorkflowStatus(workflowData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger analysis");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center text-red-600">
          {error || "Project not found"}
        </div>
        <div className="text-center mt-4">
          <Button onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const topCollision = collisions?.collisions[0];
  const latestSummary = aiSummaries[0];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">

      {/* HEADER */}
      <Card title="Incident Overview">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-lg font-bold">{project.title}</p>
            <p className="text-sm text-gray-600">{project.description || "No description"}</p>
            <p className="text-xs mt-1">Project ID: {project.id}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge text={project.status.toUpperCase()} />
            <div className="flex gap-2">
              {project.video_path && project.status !== "processing" && project.status !== "completed" && (
                <Button
                  size="sm"
                  onClick={handleStartProcessing}
                  disabled={isProcessing}
                  className="bg-orange-400 hover:bg-orange-500"
                >
                  {isProcessing ? "Processing..." : "Start Processing"}
                </Button>
              )}
              {project.status === "completed" && !workflowStatus?.has_ai_summary && (
                <Button
                  size="sm"
                  onClick={handleTriggerAnalysis}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Run AI Analysis
                </Button>
              )}
            </div>
          </div>
        </div>
        {processingStatus && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
            <p>Processing: {processingStatus.processed_frames}/{processingStatus.total_frames} frames</p>
            <p>Detections: {processingStatus.detection_count}</p>
            <p>Status: {processingStatus.status}</p>
          </div>
        )}
      </Card>

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT COLUMN – TECHNICAL / EVIDENCE */}
        <div className="space-y-6">

          <Card title="Video Evidence">
            {project.video_path ? (
              <video
                src={project.video_path}
                controls
                className="w-full rounded border"
              />
            ) : (
              <p className="text-sm text-gray-500">No video uploaded</p>
            )}
          </Card>

          <Card title="Calibration & Measurement">
            {homographySession ? (
              <>
                <p>Status: <Badge text={homographySession.status} /></p>
                <p>Calibration pairs: {homographySession.pairs.length}</p>
                {homographySession.reprojection_error != null && typeof homographySession.reprojection_error === 'number' && (
                  <p className="text-xs">
                    Reprojection error: {homographySession.reprojection_error.toExponential(2)}
                  </p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-orange-400"
                  onClick={() => setShowCalibration(!showCalibration)}
                >
                  {showCalibration ? "Hide Calibration" : (homographySession.pairs.length >= 4 ? "Edit Calibration" : "Setup Calibration")}
                </Button>
              </>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-2">No calibration data</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-400"
                  onClick={() => setShowCalibration(!showCalibration)}
                >
                  {showCalibration ? "Hide Calibration" : "Setup Calibration"}
                </Button>
              </div>
            )}
          </Card>
          
          {/* Calibration Component */}
          {showCalibration && (
            <CalibrationComponent
              project={project}
              projectId={projectId}
              onClose={() => setShowCalibration(false)}
            />
          )}

          <Card title="Processing Summary">
            {workflowStatus ? (
              <ul className="text-sm space-y-1">
                {workflowStatus.processing_run_id && (
                  <li>Run ID: {workflowStatus.processing_run_id.slice(0, 8)}...</li>
                )}
                <li>Status: {workflowStatus.processing_status || "Not started"}</li>
                <li>Detections: {workflowStatus.detection_count}</li>
                <li>Collisions: {workflowStatus.collision_count}</li>
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No processing data</p>
            )}
          </Card>

          <Card title="Detection Statistics">
            {stats ? (
              <ul className="text-sm space-y-1">
                <li>Total detections: {stats.total_detections}</li>
                <li>Total frames: {stats.total_frames}</li>
                <li>Unique tracks: {stats.unique_tracks}</li>
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No statistics available</p>
            )}
          </Card>

        </div>

        {/* RIGHT COLUMN – ANALYSIS / INTELLIGENCE */}
        <div className="space-y-6">

          <Card title="Collision Analysis">
            {topCollision ? (
              <div className="border rounded p-3 text-sm space-y-1">
                <p>
                  Vehicles: #{topCollision.track_id_1} × #{topCollision.track_id_2}
                </p>
                <p>Severity: <Badge text={topCollision.severity} /></p>
                <p>Max IoU: {topCollision.max_iou.toFixed(4)}</p>
                <p>Duration: {topCollision.duration_frames} frames</p>
                <p>
                  Frames: {topCollision.first_contact_frame} → {topCollision.last_overlap_frame}
                </p>
                {topCollision.key_frames && (
                  <p className="text-xs text-gray-500">
                    Key frames: {JSON.stringify(topCollision.key_frames)}
                  </p>
                )}
              </div>
            ) : collisions && collisions.total_collisions === 0 ? (
              <p className="text-sm text-gray-500">No collisions detected</p>
            ) : (
              <p className="text-sm text-gray-500">Loading collision data...</p>
            )}
          </Card>

          {topCollision && (
            <Timeline collision={topCollision} />
          )}

          <Card title="AI Summary & Recommendations">
            {latestSummary ? (
              <div className="space-y-4">
                {latestSummary.severity_assessment && (
                  <div className="border-l-4 border-orange-400 pl-4">
                    <h3 className="font-semibold text-sm mb-2">Severity</h3>
                    <div className="text-sm prose prose-sm max-w-none">
                      <ReactMarkdown>{latestSummary.severity_assessment}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {latestSummary.summary_text && (
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Summary</h3>
                    <div className="text-sm prose prose-sm max-w-none">
                      <ReactMarkdown>{latestSummary.summary_text}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {latestSummary.recommendations && (
                  <div className="border-l-4 border-blue-400 pl-4">
                    <h3 className="font-semibold text-sm mb-2">Recommendations</h3>
                    <div className="text-sm prose prose-sm max-w-none">
                      <ReactMarkdown>{latestSummary.recommendations}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {latestSummary.ai_model && (
                  <p className="text-xs mt-4 text-gray-500">
                    Model used: {latestSummary.ai_model}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No AI summary available yet</p>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}

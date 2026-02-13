"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { getAuthToken, createProject, uploadVideo, getProjects, Project } from "@/lib/api";

type VideoUploadBoxProps = {
  isLoggedIn: boolean;
};

export default function VideoUploadBox({ isLoggedIn }: VideoUploadBoxProps) {
  const router = useRouter();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useExistingProject, setUseExistingProject] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const hasAuthToken = typeof window !== "undefined" && !!getAuthToken();
  const actuallyLoggedIn = isLoggedIn && hasAuthToken;

  // Load projects when component mounts and user is logged in
  useEffect(() => {
    if (actuallyLoggedIn) {
      loadProjects();
    }
  }, [actuallyLoggedIn]);

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const response = await getProjects();
      setProjects(response.data);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      if (!file.type.startsWith("video/")) {
        setError("Please select a valid video file");
        return;
      }
      setVideoFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!actuallyLoggedIn) {
      router.push("/login");
      return;
    }

    if (!videoFile) return;

    setIsLoading(true);
    setError(null);

    try {
      let projectId = selectedProjectId;

      // Create new project if not using existing one
      if (!useExistingProject || !projectId) {
        if (!projectTitle.trim()) {
          setError("Please enter a project title");
          setIsLoading(false);
          return;
        }

        const newProject = await createProject({
          title: projectTitle,
          description: projectDescription || undefined,
        });
        projectId = newProject.id;
      }

      // Upload video
      await uploadVideo(projectId, videoFile);

      // Navigate to project detail page
      router.push(`/incident/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload video");
      console.error("Upload error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-4xl p-6 border rounded-md bg-gray-100 min-h-120 flex flex-col items-center justify-center">
      {/* Upload form */}
      <div
        className={`${
          !actuallyLoggedIn ? "blur-sm pointer-events-none" : ""
        } space-y-4 w-full max-w-sm flex flex-col items-center`}
      >
        {/* Project selection */}
        {actuallyLoggedIn && (
          <div className="w-full space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useExisting"
                checked={useExistingProject}
                onChange={(e) => setUseExistingProject(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="useExisting" className="text-sm">
                Use existing project
              </Label>
            </div>

            {useExistingProject ? (
              <div className="space-y-2">
                <Label htmlFor="projectSelect">Select Project</Label>
                <select
                  id="projectSelect"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-white"
                  disabled={isLoadingProjects}
                >
                  <option value="">Select a project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2 w-full">
                <Label htmlFor="projectTitle">Project Title *</Label>
                <Input
                  id="projectTitle"
                  type="text"
                  placeholder="e.g., Accident Analysis #1"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                />
                <Label htmlFor="projectDescription">Description (optional)</Label>
                <Input
                  id="projectDescription"
                  type="text"
                  placeholder="Brief description of the incident"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* Video file input */}
        <div className="w-full space-y-2">
          <Label htmlFor="videoFile">Video File</Label>
          <Input
            id="videoFile"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          {videoFile && (
            <p className="text-xs text-gray-600">
              Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Upload button */}
        <Button
          variant="outline"
          onClick={handleUpload}
          disabled={!videoFile || isLoading || (useExistingProject && !selectedProjectId) || (!useExistingProject && !projectTitle.trim())}
          className="w-full border-orange-400"
        >
          {isLoading ? "Uploading..." : "Upload Video"}
        </Button>
      </div>

      {/* Overlay if not logged in */}
      {!actuallyLoggedIn && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center rounded-md text-white text-center px-4">
          <p className="mb-2 font-semibold text-lg">Sign in to upload videos</p>
          <Button
            onClick={() => router.push("/login")}
            variant="default"
            className="bg-orange-400 hover:bg-orange-500"
          >
            Sign In
          </Button>
        </div>
      )}
    </div>
  );
}

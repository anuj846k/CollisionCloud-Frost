"use client";

// AUTHENTICATION COMMENTED OUT FOR LAYOUT DEVELOPMENT
import { useState, useRef } from "react";
// import {
//   getProject,
//   getOrCreateHomographySession,
//   updateHomographyPairs,
//   solveHomography,
//   type Project,
//   type HomographySession,
//   type HomographyPair,
// } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Project, HomographySession } from "@/lib/api";

interface Point {
  id: string;
  imageX: number;
  imageY: number;
  mapLat?: number;
  mapLng?: number;
  orderIdx: number;
}

interface CalibrationComponentProps {
  project: Project;
  projectId: string;
  onClose?: () => void;
}

export default function CalibrationComponent({ project, projectId, onClose }: CalibrationComponentProps) {
  // MOCK DATA
  const mockSession: HomographySession = {
    id: "session-uuid-123",
    project_id: projectId,
    status: "solved",
    created_at: "2024-12-13T10:01:00Z",
    solved_at: "2024-12-13T10:02:00Z",
    pairs: [
      {
        id: "pair-1",
        image_x_norm: 0.25,
        image_y_norm: 0.3,
        map_lat: 37.7749,
        map_lng: -122.4194,
        order_idx: 0,
      },
      {
        id: "pair-2",
        image_x_norm: 0.75,
        image_y_norm: 0.3,
        map_lat: 37.7750,
        map_lng: -122.4195,
        order_idx: 1,
      },
      {
        id: "pair-3",
        image_x_norm: 0.25,
        image_y_norm: 0.7,
        map_lat: 37.7748,
        map_lng: -122.4193,
        order_idx: 2,
      },
      {
        id: "pair-4",
        image_x_norm: 0.75,
        image_y_norm: 0.7,
        map_lat: 37.7751,
        map_lng: -122.4196,
        order_idx: 3,
      },
    ],
    matrix: [
      [1.2, 0.1, -0.5],
      [0.05, 1.1, -0.3],
      [0.001, 0.002, 1.0],
    ],
    reprojection_error: 1.42e-14,
  };

  // MOCK: Use mock data instead of API calls
  const [session] = useState<HomographySession>(mockSession);
  const [points, setPoints] = useState<Point[]>(() => {
    // Initialize points from mock session
    return mockSession.pairs.map((pair, idx) => ({
      id: pair.id || `point-${idx}`,
      imageX: pair.image_x_norm,
      imageY: pair.image_y_norm,
      mapLat: pair.map_lat,
      mapLng: pair.map_lng,
      orderIdx: pair.order_idx ?? idx,
    }));
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [solving, setSolving] = useState(false);
  const [solveResult, setSolveResult] = useState<any>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // AUTHENTICATION AND API CALLS COMMENTED OUT
  // const [session, setSession] = useState<HomographySession | null>(null);
  // const [loading, setLoading] = useState(true);
  // useEffect(() => {
  //   const loadData = async () => {
  //     if (!projectId) return;
  //     try {
  //       const [projectData, sessionData] = await Promise.all([
  //         getProject(projectId),
  //         getOrCreateHomographySession(projectId),
  //       ]);
  //       setProject(projectData);
  //       setSession(sessionData);
  //       const initialPoints: Point[] = sessionData.pairs.map((pair, idx) => ({
  //         id: pair.id || `point-${idx}`,
  //         imageX: pair.image_x_norm,
  //         imageY: pair.image_y_norm,
  //         mapLat: pair.map_lat,
  //         mapLng: pair.map_lng,
  //         orderIdx: pair.order_idx ?? idx,
  //       }));
  //       setPoints(initialPoints.length > 0 ? initialPoints : []);
  //     } catch (err) {
  //       setError(err instanceof Error ? err.message : "Failed to load data");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   loadData();
  // }, [projectId]);

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.offsetWidth,
        height: imageRef.current.offsetHeight,
      });
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const newPoint: Point = {
      id: `point-${Date.now()}`,
      imageX: x,
      imageY: y,
      orderIdx: points.length,
    };

    setPoints([...points, newPoint]);
  };

  const handleMapCoordinatesChange = (pointId: string, lat: number, lng: number) => {
    setPoints(
      points.map((p) =>
        p.id === pointId ? { ...p, mapLat: lat, mapLng: lng } : p
      )
    );
  };

  const handleRemovePoint = (pointId: string) => {
    setPoints(points.filter((p) => p.id !== pointId));
  };

  const handleSave = () => {
    // MOCK: Just show alert
    const validPoints = points.filter((p) => p.mapLat !== undefined && p.mapLng !== undefined);
    if (validPoints.length < 4) {
      setError("At least 4 points with map coordinates are required");
      return;
    }
    alert("Mock: Calibration points saved successfully!");
    setError(null);
    
    // AUTHENTICATION AND API CALLS COMMENTED OUT
    // if (!session) return;
    // setSaving(true);
    // setError(null);
    // try {
    //   const pairs: HomographyPair[] = validPoints.map((p, idx) => ({
    //     image_x_norm: p.imageX,
    //     image_y_norm: p.imageY,
    //     map_lat: p.mapLat!,
    //     map_lng: p.mapLng!,
    //     order_idx: idx,
    //   }));
    //   await updateHomographyPairs(session.id, pairs);
    //   const updatedSession = await getOrCreateHomographySession(projectId);
    //   setSession(updatedSession);
    //   setError(null);
    //   alert("Calibration points saved successfully!");
    // } catch (err) {
    //   setError(err instanceof Error ? err.message : "Failed to save points");
    // } finally {
    //   setSaving(false);
    // }
  };

  const handleSolve = () => {
    // MOCK: Just show alert
    alert("Mock: Homography solved successfully!");
    setSolveResult({ success: true, reprojection_error: 1.42e-14 });
    
    // AUTHENTICATION AND API CALLS COMMENTED OUT
    // if (!session) return;
    // setSolving(true);
    // setError(null);
    // try {
    //   const result = await solveHomography(session.id);
    //   setSolveResult(result);
    //   if (result.success) {
    //     const updatedSession = await getOrCreateHomographySession(projectId);
    //     setSession(updatedSession);
    //     alert("Homography solved successfully!");
    //   } else {
    //     setError(result.error_message || "Failed to solve homography");
    //   }
    // } catch (err) {
    //   setError(err instanceof Error ? err.message : "Failed to solve homography");
    // } finally {
    //   setSolving(false);
    // }
  };

  return (
    <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h2 className="text-lg sm:text-xl font-bold">Calibration Setup</h2>
        {onClose && (
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm">
            Close
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-xs sm:text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
        {/* Image Panel */}
        <Card className="w-full overflow-hidden">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-base sm:text-lg">Video Frame</CardTitle>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Click on points in the image to mark calibration points
            </p>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            {project.video_path ? (
              <div className="relative border rounded-lg overflow-hidden bg-gray-50 w-full">
                <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                  <img
                    ref={imageRef}
                    src={project.video_path}
                    alt="Video frame"
                    className="w-full h-full cursor-crosshair object-contain"
                    onClick={handleImageClick}
                    onLoad={handleImageLoad}
                  />
                  {/* Render points on image */}
                  {points.map((point) => (
                    <div
                      key={point.id}
                      className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 shadow-md"
                      style={{
                        left: `${point.imageX * 100}%`,
                        top: `${point.imageY * 100}%`,
                      }}
                      title={`Point ${point.orderIdx + 1}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full border rounded-lg bg-gray-50 flex items-center justify-center" style={{ aspectRatio: '16/9', minHeight: '200px' }}>
                <p className="text-sm text-gray-500">No video available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Points List */}
        <Card className="w-full overflow-hidden">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-base sm:text-lg">Calibration Points</CardTitle>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Enter map coordinates (latitude, longitude) for each point
            </p>
          </CardHeader>
          <CardContent className="space-y-4 p-3 sm:p-4 md:p-6 pt-0">
            {points.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-sm text-gray-500">
                  Click on the image to add calibration points
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-[250px] sm:max-h-[350px] md:max-h-[450px] lg:max-h-[500px] overflow-y-auto pr-1 sm:pr-2">
                {points.map((point, idx) => (
                  <div
                    key={point.id}
                    className="border rounded-lg p-2.5 sm:p-3 md:p-4 space-y-2 sm:space-y-3 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <span className="font-medium text-sm sm:text-base">Point {idx + 1}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemovePoint(point.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div className="truncate">
                        <Label className="text-xs text-gray-600">Image X: <span className="font-mono">{point.imageX.toFixed(4)}</span></Label>
                      </div>
                      <div className="truncate">
                        <Label className="text-xs text-gray-600">Image Y: <span className="font-mono">{point.imageY.toFixed(4)}</span></Label>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`lat-${point.id}`} className="text-xs sm:text-sm font-medium">
                          Latitude
                        </Label>
                        <Input
                          id={`lat-${point.id}`}
                          type="number"
                          step="any"
                          value={point.mapLat || ""}
                          onChange={(e) =>
                            handleMapCoordinatesChange(
                              point.id,
                              parseFloat(e.target.value) || 0,
                              point.mapLng || 0
                            )
                          }
                          placeholder="e.g., 37.7749"
                          className="text-sm h-9 sm:h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`lng-${point.id}`} className="text-xs sm:text-sm font-medium">
                          Longitude
                        </Label>
                        <Input
                          id={`lng-${point.id}`}
                          type="number"
                          step="any"
                          value={point.mapLng || ""}
                          onChange={(e) =>
                            handleMapCoordinatesChange(
                              point.id,
                              point.mapLat || 0,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="e.g., -122.4194"
                          className="text-sm h-9 sm:h-10"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving || points.length < 4}
                className="flex-1 bg-orange-400 hover:bg-orange-500 text-sm sm:text-base h-10 sm:h-11 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Points"}
              </Button>
              <Button
                onClick={handleSolve}
                disabled={solving || !session || session.status !== "draft"}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-sm sm:text-base h-10 sm:h-11 disabled:opacity-50"
              >
                {solving ? "Solving..." : "Solve Homography"}
              </Button>
            </div>

            {solveResult && solveResult.success && (
              <div className="p-3 sm:p-4 bg-green-50 border border-green-300 text-green-800 rounded-lg text-xs sm:text-sm">
                <p className="font-semibold">✓ Homography solved successfully!</p>
                {solveResult.reprojection_error !== undefined && (
                  <p className="mt-1.5 text-xs opacity-90">
                    Reprojection error: <span className="font-mono">{solveResult.reprojection_error.toExponential(2)}</span>
                  </p>
                )}
              </div>
            )}

            {session?.status === "solved" && (
              <div className="p-3 sm:p-4 bg-blue-50 border border-blue-300 text-blue-800 rounded-lg text-xs sm:text-sm">
                <p className="font-semibold">✓ Calibration is complete and active</p>
                {session.reprojection_error !== undefined && (
                  <p className="mt-1.5 text-xs opacity-90">
                    Reprojection error: <span className="font-mono">{session.reprojection_error.toExponential(2)}</span>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


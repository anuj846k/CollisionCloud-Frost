"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CollisionResponse } from "@/lib/api";
import { 
  ArrowRight, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUp,
  Clock,
  ChevronRight
} from "lucide-react";

interface TimelineEvent {
  phase: string;
  phaseLabel: string;
  frame: number;
  timestamp: number;
  description: string;
  color: string;
  icon: React.ReactNode;
}

interface TimelineProps {
  collision: CollisionResponse;
  fps?: number; // Frames per second, default 30
}

const DEFAULT_FPS = 30;

const getPhaseInfo = (phase: string, trackId1: number, trackId2: number, frame: number, timestamp: number) => {
  const phaseLower = phase.toLowerCase();
  
  if (phaseLower === "approach") {
    return {
      label: "APPROACH",
      description: `At ${timestamp.toFixed(3)}s: Vehicle ${trackId1} and Vehicle ${trackId2} are approaching`,
      color: "bg-blue-100 text-blue-800 border-blue-300",
      icon: <ArrowRight className="w-4 h-4" />,
    };
  } else if (phaseLower === "contact" || phaseLower === "first_contact") {
    return {
      label: "FIRST_CONTACT",
      description: `At ${timestamp.toFixed(3)}s: First contact detected between Vehicle ${trackId1} and Vehicle ${trackId2}`,
      color: "bg-red-100 text-red-800 border-red-300",
      icon: <AlertTriangle className="w-4 h-4" />,
    };
  } else if (phaseLower === "peak" || phaseLower === "peak_overlap") {
    return {
      label: "PEAK_OVERLAP",
      description: `At ${timestamp.toFixed(3)}s: Maximum overlap between Vehicle ${trackId1} and Vehicle ${trackId2}`,
      color: "bg-orange-100 text-orange-800 border-orange-300",
      icon: <TrendingUp className="w-4 h-4" />,
    };
  } else if (phaseLower === "separation") {
    return {
      label: "SEPARATION",
      description: `At ${timestamp.toFixed(3)}s: Vehicles separating - Vehicle ${trackId1} and Vehicle ${trackId2}`,
      color: "bg-green-100 text-green-800 border-green-300",
      icon: <ArrowUp className="w-4 h-4" />,
    };
  }
  
  return {
    label: phase.toUpperCase(),
    description: `At ${timestamp.toFixed(3)}s: ${phase} at frame ${frame}`,
    color: "bg-gray-100 text-gray-800 border-gray-300",
    icon: <Clock className="w-4 h-4" />,
  };
};

const formatTimestamp = (timestamp: number): string => {
  const minutes = Math.floor(timestamp / 60);
  const seconds = Math.floor(timestamp % 60);
  const milliseconds = Math.floor((timestamp % 1) * 1000);
  
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }
  return `0:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
};

export default function Timeline({ collision, fps = DEFAULT_FPS }: TimelineProps) {
  const events: TimelineEvent[] = [];
  
  const { key_frames, track_id_1, track_id_2 } = collision;
  
  // Build timeline events from key_frames
  if (key_frames) {
    // Approach
    if (key_frames.approach !== undefined) {
      const frame = key_frames.approach;
      const timestamp = frame / fps;
      const phaseInfo = getPhaseInfo("approach", track_id_1, track_id_2, frame, timestamp);
      events.push({
        phase: "approach",
        phaseLabel: phaseInfo.label,
        frame,
        timestamp,
        description: phaseInfo.description,
        color: phaseInfo.color,
        icon: phaseInfo.icon,
      });
    }
    
    // First Contact
    if (key_frames.contact !== undefined) {
      const frame = key_frames.contact;
      const timestamp = frame / fps;
      const phaseInfo = getPhaseInfo("contact", track_id_1, track_id_2, frame, timestamp);
      events.push({
        phase: "contact",
        phaseLabel: phaseInfo.label,
        frame,
        timestamp,
        description: phaseInfo.description,
        color: phaseInfo.color,
        icon: phaseInfo.icon,
      });
    }
    
    // Peak Overlap
    if (key_frames.peak !== undefined) {
      const frame = key_frames.peak;
      const timestamp = frame / fps;
      const phaseInfo = getPhaseInfo("peak", track_id_1, track_id_2, frame, timestamp);
      events.push({
        phase: "peak",
        phaseLabel: phaseInfo.label,
        frame,
        timestamp,
        description: phaseInfo.description,
        color: phaseInfo.color,
        icon: phaseInfo.icon,
      });
    }
    
    // Separation
    if (key_frames.separation !== undefined) {
      const frame = key_frames.separation;
      const timestamp = frame / fps;
      const phaseInfo = getPhaseInfo("separation", track_id_1, track_id_2, frame, timestamp);
      events.push({
        phase: "separation",
        phaseLabel: phaseInfo.label,
        frame,
        timestamp,
        description: phaseInfo.description,
        color: phaseInfo.color,
        icon: phaseInfo.icon,
      });
    }
  }
  
  // Fallback: if no key_frames, use first_contact_frame, peak_overlap_frame, last_overlap_frame
  if (events.length === 0) {
    if (collision.first_contact_frame !== undefined) {
      const frame = collision.first_contact_frame;
      const timestamp = frame / fps;
      const phaseInfo = getPhaseInfo("contact", track_id_1, track_id_2, frame, timestamp);
      events.push({
        phase: "contact",
        phaseLabel: phaseInfo.label,
        frame,
        timestamp,
        description: phaseInfo.description,
        color: phaseInfo.color,
        icon: phaseInfo.icon,
      });
    }
    
    if (collision.peak_overlap_frame !== undefined) {
      const frame = collision.peak_overlap_frame;
      const timestamp = frame / fps;
      const phaseInfo = getPhaseInfo("peak", track_id_1, track_id_2, frame, timestamp);
      events.push({
        phase: "peak",
        phaseLabel: phaseInfo.label,
        frame,
        timestamp,
        description: phaseInfo.description,
        color: phaseInfo.color,
        icon: phaseInfo.icon,
      });
    }
    
    if (collision.last_overlap_frame !== undefined) {
      const frame = collision.last_overlap_frame;
      const timestamp = frame / fps;
      const phaseInfo = getPhaseInfo("separation", track_id_1, track_id_2, frame, timestamp);
      events.push({
        phase: "separation",
        phaseLabel: phaseInfo.label,
        frame,
        timestamp,
        description: phaseInfo.description,
        color: phaseInfo.color,
        icon: phaseInfo.icon,
      });
    }
  }
  
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No timeline events available</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <CardTitle className="text-base sm:text-lg">Event Timeline</CardTitle>
            <span className="px-2 py-0.5 text-xs border rounded">
              {events.length}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event, index) => (
            <div
              key={`${event.phase}-${event.frame}-${index}`}
              className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`flex items-center gap-2 px-2 py-1 rounded border ${event.color} text-xs font-semibold`}>
                    {event.icon}
                    <span>{event.phaseLabel}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{event.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatTimestamp(event.timestamp)}</span>
                      <span>Frame {event.frame}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


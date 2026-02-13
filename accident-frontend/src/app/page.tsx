"use client";

import { useState, useEffect } from "react";
import VideoUploadBox from "@/components/VideoUploadBox";
import { getAuthToken } from "@/lib/api";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth on mount - this runs once after hydration
    const checkAuth = () => {
      const token = getAuthToken();
      setIsLoggedIn(!!token);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <VideoUploadBox isLoggedIn={isLoggedIn} />
    </div>
  );
}

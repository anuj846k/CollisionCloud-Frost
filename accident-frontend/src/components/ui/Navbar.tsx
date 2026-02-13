"use client";

import { Button } from "./button";
import { useRouter } from "next/navigation";
import { getAuthToken, removeAuthToken } from "@/lib/api";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken();
      setIsLoggedIn(!!token);
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    setIsLoggedIn(false);
    router.push("/login");
  };

  return (
    <nav className="flex items-center justify-between px-6 py-2 border-b">
      {/* Logo */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => {
          router.push("/");
        }}
      >
        <h1 className="text-black text-2xl font-sans">
          Collision
          <span className="text-orange-400 font-mono font-medium ml-1">
            Cloud
          </span>
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <>
            <Button
              variant="outline"
              className="border-orange-400"
              onClick={() => {
                router.push("/dashboard");
              }}
            >
              Dashboard
            </Button>
            <Button
              variant="outline"
              className="border-orange-400"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              className="border-orange-400"
              onClick={() => {
                router.push("/login");
              }}
            >
              Login
            </Button>
            <Button
              variant="outline"
              className="border-orange-400"
              onClick={() => {
                router.push("/signup");
              }}
            >
              Signup
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthContext } from "./AuthContext";
import api from "@/utils/api";
import type { AppUser } from "./Types";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);

  const pathname = usePathname();

  // Add all public paths here
  const publicPaths = ["/"];
  const isPublicRoute = publicPaths.includes(pathname);

  const fetchUser = async () => {
    // Skip user fetching if we've already initialized
    if (initialized) return;

    try {
      setLoading(true);
      console.log("Fetching user data...");

      // Only actually fetch if we're not on a public route
      if (!isPublicRoute) {
        const response = await api.get("/users/current-user");
        const userData = response.data.data;
        console.log("User data fetched:", userData);
        setUser(userData);
        setError(null); // clear error if success
      } else {
        // On public routes, just mark as initialized without fetching
        console.log("Skipping user fetch on public route");
      }
    } catch (error: any) {
      console.error("Error fetching user:", error?.response?.status || error);

      if (error?.response?.status === 401) {
        setUser(null);

        // Only show error on protected routes
        if (!isPublicRoute) {
          setError("You must be logged in to access this page.");
        }
      } else {
        // For non-401 errors, only show on protected routes
        if (!isPublicRoute) {
          setError("Something went wrong!");
        }
      }
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await api.post("/users/logout");
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/current-user");
      const userData = response.data.data;
      setUser(userData);
    } catch (error: any) {
      console.error("Failed to refresh user data:", error);
      // If 401, clear user
      if (error.response?.status === 401) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Call fetchUser once on component mount
    if (!initialized) {
      fetchUser();
    }
  }, [pathname]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading: loading && !isPublicRoute,
        error: isPublicRoute ? null : error,
        handleLogout,
        refreshUserData,
        isPublicRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

"use client";

import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import api from "@/utils/api";
import type { AppUser } from "./Types";
import LoadingScreen from "@/components/LoadingScreen";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/current-user");
      const userData = response.data.data;
      setUser(userData);
      setError(null); // clear error if success
    } catch (error: any) {
      console.error("Error fetching user:", error?.response?.status || error);
      if (error?.response?.status === 401) {
        setUser(null);
      } else {
        // For non-401 errors, only show on protected routes
      }
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchUser();
  }, []);

  return loading ? (
    <LoadingScreen />
  ) : (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading: loading,
        error: error,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

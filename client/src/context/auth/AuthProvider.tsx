"use client";

import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import api from "@/utils/api";
import type { AppUser } from "./Types";
import LoadingScreen from "@/components/LoadingScreen";
import { socket } from "@/utils/socket";
import { toast } from "sonner";
import type { Notification } from "./Types";
import { usePathname, useRouter } from "next/navigation";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [redBadge, setRedBadge] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/current-user", {
        withCredentials: true,
      });

      const { status, data, message } = res.data;
      const userData = data;
      console.log("User data:", userData);
      if (res.status === 200) {
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      console.error(
        "Error fetching user:",
        error?.response?.data?.message || error
      );
      if (error?.response?.status === 401) {
        setUser(null);
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

  const isUnauthorized =
    !loading &&
    user &&
    ((user.role === "developer" && pathname.includes("/organizer")) ||
      (user.role === "organizer" && pathname.includes("/developer")));

  useEffect(() => {
    if (isUnauthorized) {
      window.location.href = "/unauthorized";
    }
  }, []);

  useEffect(() => {
    if (user && user.id) {
      socket.emit("join", user.id);
      if (user.role === "developer") {
        socket.on("invitation-accepted", (notification: Notification) => {
          toast(notification.message);
          setRedBadge(true);
          setNotifications((prev) => [...prev, notification]);
        });

        socket.on("new-invitation", (notification: Notification) => {
          toast(notification.message);
          setRedBadge(true);
          setNotifications((prev) => [...prev, notification]);
        });
      }
    }
  }, [user]);

  useEffect(() => {
    if (
      !loading &&
      user &&
      !user.isProfileComplete &&
      ((user.role === "developer" &&
        !pathname.startsWith("/developer/complete-profile")) ||
        (user.role === "organizer" &&
          !pathname.startsWith("/organizer/complete-profile")))
    ) {
      window.location.href =
        user.role === "developer"
          ? "/developer/complete-profile"
          : "/organizer/complete-profile";
    }
  }, [user, loading, pathname]);

  return loading ? (
    <LoadingScreen />
  ) : (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading: loading,
        isAuthenticated,
        handleLogout,
        notifications,
        setNotifications,
        redBadge,
        setRedBadge,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

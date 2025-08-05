"use client";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import api from "@/utils/api";
import { toast } from "sonner";
import { X, Bell } from "lucide-react";
import { withAuth } from "@/utils/withAuth";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
const socket = io(`${process.env.NEXT_PUBLIC_API_URL}`);

interface Notification {
  id: string;
  type: string;
  message: string;
  teamId?: string;
  createdAt: string;
}

function NotificationsPage() {
  const { notifications, setNotifications } = useAuth();
  const [filterType, setFilterType] = useState<
    "all" | "invitation-sent" | "invitation-accepted"
  >("all");

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/developer/notifications", {
        withCredentials: true,
      });

      const { status, data, message } = res.data;

      if (status === 200) {
        if (setNotifications) {
          setNotifications(data || []);
        }
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch notifications"
      );
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleDeleteNotification = async (id: string) => {
    try {
      const res = await api.delete(`/developer/notifications/${id}`);

      const { status, data, message } = res.data;
      if (status === 200) {
        toast.success(message || "Notification deleted successfully");
        if (setNotifications) {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete notification"
      );
      console.error("Error deleting notification:", error);
    }
  };

  // Filter notifications by type
  const filteredNotifications =
    filterType === "all"
      ? notifications ?? []
      : (notifications ?? []).filter((n) => n.type === filterType);

  return (
    <div className="min-h-screen flex  px-4 sm:px-6 lg:px-8 mt-4">
      <div className="max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="rounded-3xl mb-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] flex items-center justify-center shadow-xl border-4 border-white">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#062a47] tracking-tight">
            Notifications
          </h1>
        </div>
        {/* Filter Buttons */}
        <div className="flex gap-3 mb-8 ">
          <button
            className={`px-6 py-2 rounded-full text-sm font-semibold border transition shadow ${
              filterType === "all"
                ? "bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white border-[#FF9466]"
                : "bg-gradient-to-br from-white via-white to-[#fff9f5] text-[#062a47] border-[#eaf6fb] hover:border-[#FF9466]"
            }`}
            onClick={() => setFilterType("all")}
          >
            All
          </button>
          <button
            className={`px-6 py-2 rounded-full text-sm font-semibold border transition shadow ${
              filterType === "invitation-sent"
                ? "bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white border-[#FF9466]"
                : "bg-gradient-to-br from-white via-white to-[#fff9f5] text-[#062a47] border-[#eaf6fb] hover:border-[#FF9466]"
            }`}
            onClick={() => setFilterType("invitation-sent")}
          >
            Invitation Sent
          </button>
          <button
            className={`px-6 py-2 rounded-full text-sm font-semibold border transition shadow ${
              filterType === "invitation-accepted"
                ? "bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white border-[#FF9466]"
                : "bg-gradient-to-br from-white via-white to-[#fff9f5] text-[#062a47] border-[#eaf6fb] hover:border-[#FF9466]"
            }`}
            onClick={() => setFilterType("invitation-accepted")}
          >
            Invitation Accepted
          </button>
        </div>
        <ul className="space-y-6">
          {filteredNotifications.length === 0 && (
            <li>
              <div className="text-[#6B7A8F] text-center py-12 bg-gradient-to-br from-white via-white to-[#fff9f5] rounded-xl border border-[#eaf6fb] shadow">
                No notifications.
              </div>
            </li>
          )}
          {filteredNotifications.map((notification) => (
            <li
              key={notification.id}
              className="flex items-center justify-between bg-gradient-to-r from-[#fff9f5] to-[#f8f8f8] border border-[#eaf6fb] rounded-xl px-6 py-5 shadow-lg transition hover:border-[#FF9466]"
            >
              <div>
                <div className="font-semibold text-[#FF6F61] mb-1 text-lg">
                  {notification.type
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </div>
                {notification.type === "invitation-sent" ? (
                  <Link href={`/team/joined-teams/${notification.teamId}`}>
                    <div className="text-[#062a47] font-medium hover:underline">
                      {notification.message}
                    </div>
                  </Link>
                ) : notification.type === "invitation-accepted" ? (
                  <Link href={`/team/view-all-teams/${notification.teamId}`}>
                    <div className="text-[#062a47] font-medium hover:underline">
                      {notification.message}
                    </div>
                  </Link>
                ) : (
                  <div className="text-[#062a47] font-medium">
                    {notification.message}
                  </div>
                )}
                <div className="text-xs text-[#6B7A8F] mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => handleDeleteNotification(notification.id)}
                className="group ml-4 p-2 rounded-full hover:bg-[#FF6F61] transition cursor-pointer"
                title="Delete notification"
                aria-label="Delete notification"
              >
                <X
                  size={20}
                  className="text-[#FF6F61] group-hover:text-[#fff5f4]"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default withAuth(NotificationsPage, "developer");

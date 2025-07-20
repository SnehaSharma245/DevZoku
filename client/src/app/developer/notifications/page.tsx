"use client";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import api from "@/utils/api";
import { toast } from "sonner";
import { X, Bell } from "lucide-react";
import { withAuth } from "@/utils/withAuth";
import Link from "next/link";
const socket = io(`${process.env.NEXT_PUBLIC_API_URL}`);

interface Notification {
  id: string;
  type: string;
  message: string;
  teamId?: string;
  createdAt: string;
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<
    "all" | "invitation-sent" | "invitation-accepted"
  >("all");

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/developer/notifications", {
        withCredentials: true,
      });

      const { status, data, message } = res.data;
      console.log(data);
      if (status === 200) {
        setNotifications(data || []);
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
        setNotifications((prev) => prev.filter((n) => n.id !== id));
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
      ? notifications
      : notifications.filter((n) => n.type === filterType);

  return (
    <div className="min-h-screen bg-[#18181e] py-10 px-2">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[#a3e635] flex items-center justify-center shadow">
            <Bell className="w-6 h-6 text-[#23232b]" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Notifications
          </h1>
        </div>
        {/* Filter Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            className={`px-4 py-1 rounded-full text-sm font-semibold border ${
              filterType === "all"
                ? "bg-[#a3e635] text-black border-[#a3e635]"
                : "bg-[#23232b] text-white border-[#23232b] hover:border-[#a3e635]"
            }`}
            onClick={() => setFilterType("all")}
          >
            All
          </button>
          <button
            className={`px-4 py-1 rounded-full text-sm font-semibold border ${
              filterType === "invitation-sent"
                ? "bg-[#a3e635] text-black border-[#a3e635]"
                : "bg-[#23232b] text-white border-[#23232b] hover:border-[#a3e635]"
            }`}
            onClick={() => setFilterType("invitation-sent")}
          >
            Invitation Sent
          </button>
          <button
            className={`px-4 py-1 rounded-full text-sm font-semibold border ${
              filterType === "invitation-accepted"
                ? "bg-[#a3e635] text-black border-[#a3e635]"
                : "bg-[#23232b] text-white border-[#23232b] hover:border-[#a3e635]"
            }`}
            onClick={() => setFilterType("invitation-accepted")}
          >
            Invitation Accepted
          </button>
        </div>
        <ul className="space-y-4">
          {filteredNotifications.length === 0 && (
            <li>
              <div className="text-gray-400 text-center py-12 bg-[#23232b] rounded-xl border border-[#23232b]">
                No notifications.
              </div>
            </li>
          )}
          {filteredNotifications.map((notification) => (
            <li
              key={notification.id}
              className="flex items-center justify-between bg-[#23232b] border border-[#23232b] rounded-xl px-5 py-4 shadow transition hover:border-[#a3e635]"
            >
              <div>
                <div className="font-semibold text-[#a3e635] mb-1">
                  {notification.type}
                </div>
                {notification.type === "invitation-sent" ? (
                  <Link href={`/team/joined-teams/${notification.teamId}`}>
                    <div className="text-white">{notification.message}</div>
                  </Link>
                ) : notification.type === "invitation-accepted" ? (
                  <Link href={`/team/view-all-teams/${notification.teamId}`}>
                    <div className="text-white">{notification.message}</div>
                  </Link>
                ) : (
                  <div className="text-white">{notification.message}</div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => handleDeleteNotification(notification.id)}
                className="ml-4 p-2 rounded-full hover:bg-[#18181e] transition"
                title="Delete notification"
                aria-label="Delete notification"
              >
                <X size={20} className="text-red-400" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default withAuth(NotificationsPage, "developer");

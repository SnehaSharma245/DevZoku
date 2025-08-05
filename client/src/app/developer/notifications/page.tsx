"use client";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import api from "@/utils/api";
import { toast } from "sonner";
import { Bell, Trash2 } from "lucide-react";
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
  developerId?: string;
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

  const handleDeleteNotification = async ({
    id,
    deleteOnlyNotification,
  }: {
    id: string;
    deleteOnlyNotification: boolean;
  }) => {
    try {
      const res = deleteOnlyNotification
        ? await api.delete(
            `/developer/notifications/${id}?deleteOnlyNotification=true`
          )
        : await api.delete(
            `/developer/notifications/${id}?deleteOnlyNotification=false`
          );

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

  // Placeholder handlers for accept/reject
  const handleAcceptInvitation = async ({
    teamId,
    developerId,
    notificationId,
  }: {
    teamId: string;
    developerId: string;
    notificationId?: string;
  }) => {
    try {
      const response = await api.post(
        `team/fetch-invites-and-accept/${teamId}?pendingUserId=${developerId}`,
        {
          withCredentials: true,
        }
      );
      const { status, data, message } = response.data;
      if (status === 200) {
        toast.success(message || "Invitation accepted");
        if (setNotifications) {
          setNotifications((prev) =>
            prev.filter((n) => n.id !== notificationId)
          );
        }
      }
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast.error(
        error?.response?.data?.message || "Failed to accept invitation"
      );
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
              className="relative flex flex-row sm:flex-row items-start justify-between bg-gradient-to-r from-[#fff9f5] to-[#f8f8f8] border border-[#eaf6fb] rounded-xl px-6 py-5 shadow-lg transition hover:border-[#FF9466]"
            >
              <div className="flex-1">
                {/* Type badge and date on same line, bin icon at top right */}
                <div className="flex flex-row items-center justify-between mb-1">
                  <div className="flex flex-row items-center gap-5">
                    <span className="flex py-1 rounded-full text-lg font-semibold text-[#FF6F61]">
                      {notification.type
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                    <span className="text-xs text-[#6B7A8F]">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {/* Bin icon top right */}
                  <button
                    className="p-2 rounded-full hover:bg-red-100 transition border border-red-200 cursor-pointer"
                    title="Delete notification "
                    aria-label="Delete notification"
                    onClick={() =>
                      handleDeleteNotification({
                        id: notification.id,
                        deleteOnlyNotification: true,
                      })
                    }
                  >
                    <Trash2 size={18} className="text-red-400" />
                  </button>
                </div>
                {/* Message and profile button, profile button below message */}
                {notification.type === "invitation-sent" ? (
                  <>
                    <Link href={`/team/joined-teams/${notification.teamId}`}>
                      <div className="text-[#062a47] font-medium hover:underline">
                        {notification.message}
                      </div>
                    </Link>
                    {/* Accept, Reject, and Profile buttons in a single horizontal line, small size */}
                    <div className="flex flex-row gap-2 mt-3 items-center">
                      <button
                        onClick={() =>
                          handleAcceptInvitation({
                            teamId: notification.teamId,
                            developerId: notification.developerId,
                            notificationId: notification.id,
                          })
                        }
                        className="h-7 min-w-[60px] px-2 rounded-full border border-green-200 bg-white text-green-700 font-semibold text-xs flex items-center justify-center transition hover:bg-green-50 hover:border-green-400 cursor-pointer"
                        title="Accept invitation"
                        aria-label="Accept invitation"
                      >
                        Accept
                      </button>
                      <button
                        className="h-7 min-w-[60px] px-2 rounded-full border border-red-200 bg-white text-red-600 font-semibold text-xs flex items-center justify-center transition hover:bg-red-50 hover:border-red-400 cursor-pointer"
                        title="Reject invitation"
                        aria-label="Reject invitation"
                        onClick={() =>
                          handleDeleteNotification({
                            id: notification.id,
                            deleteOnlyNotification: false,
                          })
                        }
                      >
                        Reject
                      </button>
                      {notification.developerId && (
                        <Link
                          href={`/developer/profile/${notification.developerId}`}
                          className="h-full"
                        >
                          <button
                            className="h-7 min-w-[60px] px-2 rounded-full border border-[#FF9466] bg-white text-[#FF9466] font-semibold text-xs flex items-center justify-center transition hover:bg-[#fff2e0] hover:border-[#FF6F61] hover:text-[#FF6F61] cursor-pointer"
                            title="View Developer Profile"
                            type="button"
                          >
                            Profile
                          </button>
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[#062a47] font-medium">
                      {notification.type === "invitation-accepted" ? (
                        <Link
                          href={`/team/view-all-teams/${notification.teamId}`}
                        >
                          <div className="hover:underline">
                            {notification.message}
                          </div>
                        </Link>
                      ) : (
                        notification.message
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* For non-invitation-sent notifications, show delete on mobile too */}
              {notification.type !== "invitation-sent" && (
                <div className="flex sm:hidden mt-2 gap-2">
                  <button
                    className="p-2 rounded-full hover:bg-red-100 transition border border-red-200 cursor-pointer"
                    title="Delete notification"
                    aria-label="Delete notification"
                    onClick={() =>
                      handleDeleteNotification({
                        id: notification.id,
                        deleteOnlyNotification: true,
                      })
                    }
                  >
                    <Trash2 size={18} className="text-red-400" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default withAuth(NotificationsPage, "developer");

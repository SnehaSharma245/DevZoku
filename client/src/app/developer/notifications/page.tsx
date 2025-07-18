"use client";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import api from "@/utils/api";
import { toast } from "sonner";
import { X } from "lucide-react";
import { withAuth } from "@/utils/withAuth";
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
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/developer/notifications", {
        withCredentials: true,
      });

      const { status, data, message } = res.data;

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

  return (
    <div>
      <h1>Notifications</h1>
      <ul>
        {notifications.map((notification) => (
          <li key={notification.id}>
            <strong>{notification.type}</strong>: {notification.message}
            <X onClick={() => handleDeleteNotification(notification.id)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default withAuth(NotificationsPage, "developer");

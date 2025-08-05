// src/utils/socket.ts
import { io } from "socket.io-client";

const SOCKET_URI =
  process.env.NEXT_PUBLIC_SOCKET_URI || "http://localhost:8000";
export const socket = io(SOCKET_URI, {
  path: "/socket/",
  withCredentials: true,
  transports: ["websocket", "polling"],
});
socket.on("connect", () => {
  console.log("Connected to the server");
});

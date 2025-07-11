// src/utils/socket.ts
import { io } from "socket.io-client";
export const socket = io(process.env.SOCKET_URI || "http://localhost:8000");
socket.on("connect", () => {
  console.log("Connected to the server");
});

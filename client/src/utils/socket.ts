// src/utils/socket.ts
import { io } from "socket.io-client";
export const socket = io(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
);
socket.on("connect", () => {
  console.log("Connected to the server");
});

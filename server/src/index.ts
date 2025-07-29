import { app } from "./app";
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 8000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: "/socket/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Socket.io connection
io.on("connection", (socket) => {
  socket.on("join", (userId: string) => {
    socket.join(userId);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { io, httpServer };

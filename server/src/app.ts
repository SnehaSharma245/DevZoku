import express from "express";

import cors from "cors";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/user.route";
import developerRoutes from "./routes/developer.route";
import teamRoutes from "./routes/team.route";
import hackathonRoutes from "./routes/hackathon.route";
import organizerRoutes from "./routes/organizer.route";
import errorMiddleware from "./middlewares/error.middleware";

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

// authorization routes
app.use("/api/v1/developer/authorization", userRoutes);
app.use("/api/v1/organizer/authorization", userRoutes);

// main application routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/developer", developerRoutes);
app.use("/api/v1/organizer", organizerRoutes);
app.use("/api/v1/hackathon", hackathonRoutes);
app.use("/api/v1/team", teamRoutes);

app.get("/api/v1/", (req, res) => {
  res.status(200).json({ message: "Welcome to DevZoku API" });
});

app.use(errorMiddleware);

export { app };

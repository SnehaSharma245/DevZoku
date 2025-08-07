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
app.use("/developer/authorization", userRoutes);
app.use("/organizer/authorization", userRoutes);

// main application routes
app.use("/users", userRoutes);
app.use("/developer", developerRoutes);
app.use("/organizer", organizerRoutes);
app.use("/hackathon", hackathonRoutes);
app.use("/team", teamRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to DevZoku API" });
});

app.use(errorMiddleware);

export { app };

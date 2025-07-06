import express from "express";

import cors from "cors";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/user.route";
import developerRoutes from "./routes/developer.route";
import organizerRoutes from "./routes/organizer.route";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use("/api/v1/developer/authorization", userRoutes);
app.use("/api/v1/organizer/authorization", userRoutes);
app.use("/api/v1/users", userRoutes);

app.use("/api/v1/developer", developerRoutes);
app.use("/api/v1/organizer", organizerRoutes);

export { app };

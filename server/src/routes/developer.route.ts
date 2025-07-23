import { Router } from "express";
import {
  completeDeveloperProfile,
  notificationHandling,
  fetchDeveloperProfile,
  fetchProjects,
  addProject,
  getRecommendedHackathons,
} from "../controllers/developer.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// Protected route for completing developer profile
router.post("/complete-profile", verifyJWT, completeDeveloperProfile);
router.get("/notifications", verifyJWT, notificationHandling);
router.delete("/notifications/:id", verifyJWT, notificationHandling);
router.get("/projects", verifyJWT, fetchProjects);
router.post("/add-project", verifyJWT, addProject);
router.get("/recommended-hackathons", verifyJWT, getRecommendedHackathons);

// unprotected route
router.get("/developer-profile/:id", fetchDeveloperProfile);
export default router;

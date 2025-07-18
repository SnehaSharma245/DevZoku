import { Router } from "express";
import {
  completeDeveloperProfile,
  notificationHandling,
  fetchDeveloperProfile,
} from "../controllers/developer.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// Protected route for completing developer profile
router.post("/complete-profile", verifyJWT, completeDeveloperProfile);
router.get("/notifications", verifyJWT, notificationHandling);
router.delete("/notifications/:id", verifyJWT, notificationHandling);

// unprotected route
router.get("/developer-profile/:id", fetchDeveloperProfile);
export default router;

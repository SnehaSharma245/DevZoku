import { Router } from "express";
import {
  completeOrganizerProfile,
  createHackathon,
} from "../controllers/organizer.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// Protected route for completing organizer profile
router.post("/complete-profile", verifyJWT, completeOrganizerProfile);
router.post("/create-hackathon", verifyJWT, createHackathon);

export default router;

import { Router } from "express";
import { completeOrganizerProfile } from "../controllers/organizer.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// Protected route for completing organizer profile
router.post("/complete-profile", verifyJWT, completeOrganizerProfile);

export default router;

import { Router } from "express";
import {
  completeOrganizerProfile,
  fetchOrganizerProfile,
} from "../controllers/organizer.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

import { upload } from "../utils/Cloudinary";
const router = Router();

// Protected route
router.post("/complete-profile", verifyJWT, completeOrganizerProfile);

// unprotected route
router.get("/profile/:id", fetchOrganizerProfile);

export default router;

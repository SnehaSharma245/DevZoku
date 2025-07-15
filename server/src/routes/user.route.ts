import { Router } from "express";
import {
  googleAuth,
  signUpWithGoogle,
  getCurrentUser,
  logoutUser,
  refreshAccessToken,
  viewAllHackathons,
  deleteCompletedHackathons,
  viewHackathonById,
} from "../controllers/user.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// Public routes

router.get("/auth/google", googleAuth);
router.get("/auth/google/callback", signUpWithGoogle);
router.post("/refresh-token", refreshAccessToken);
router.get("/view-all-hackathons", viewAllHackathons);
router.get("/hackathon/:id", viewHackathonById);
router.delete("/delete-completed-hackathons", deleteCompletedHackathons);

// Protected routes
router.get("/current-user", verifyJWT, getCurrentUser);
router.post("/logout", verifyJWT, logoutUser);

export default router;

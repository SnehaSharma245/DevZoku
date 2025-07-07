import { Router } from "express";
import {
  checkTeamNameUnique,
  completeDeveloperProfile,
  createTeam,
} from "../controllers/developer.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// Protected route for completing developer profile
router.post("/complete-profile", verifyJWT, completeDeveloperProfile);
router.post("/create-team", verifyJWT, createTeam);
router.get("/check-teamName-unique", verifyJWT, checkTeamNameUnique);
export default router;

import { Router } from "express";
import {
  checkTeamNameUnique,
  completeDeveloperProfile,
  createTeam,
  getJoinedTeams,
  viewAllTeams,
  joinInvitation,
} from "../controllers/developer.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// Protected route for completing developer profile
router.post("/complete-profile", verifyJWT, completeDeveloperProfile);
router.post("/create-team", verifyJWT, createTeam);
router.get("/check-teamName-unique", verifyJWT, checkTeamNameUnique);
router.get("/joined-teams", verifyJWT, getJoinedTeams);
router.get("/view-all-teams", verifyJWT, viewAllTeams);
router.get("/view-all-teams/:id", verifyJWT, viewAllTeams);
router.post("/join-invitation", verifyJWT, joinInvitation);
export default router;

import { Router } from "express";
import {
  createTeam,
  checkTeamNameUnique,
  getJoinedTeams,
  viewAllTeams,
  sendInvitation,
  fetchPendingInvitesAndAcceptThem,
  fetchSentInvitations,
  leaveTeam,
} from "../controllers/team.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// Protected routes
router.post("/create-team", verifyJWT, createTeam);
router.get("/check-teamName-unique", verifyJWT, checkTeamNameUnique);
router.get("/joined-teams", verifyJWT, getJoinedTeams);
router.get("/view-all-teams", verifyJWT, viewAllTeams);
router.get("/view-all-teams/:id", verifyJWT, viewAllTeams);
router.post("/send-invitation", verifyJWT, sendInvitation);
router.post(
  "/fetch-invites-and-accept/:teamId",
  verifyJWT,
  fetchPendingInvitesAndAcceptThem
);
router.get("/sent-invitations", verifyJWT, fetchSentInvitations);
router.delete("/leave-team", verifyJWT, leaveTeam);

export default router;

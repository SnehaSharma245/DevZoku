import { Router } from "express";
import {
  checkTeamNameUnique,
  completeDeveloperProfile,
  createTeam,
  getJoinedTeams,
  viewAllTeams,
  sendInvitation,
  fetchPendingInvitesAndAcceptThem,
  fetchSentInvitations,
  notificationHandling,
  applyToHackathon,
  fetchDeveloperProfile,
  leaveTeam,
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
router.post("/send-invitation", verifyJWT, sendInvitation);
router.post(
  "/fetch-invites-and-accept/:teamId",
  verifyJWT,
  fetchPendingInvitesAndAcceptThem
);
router.get("/sent-invitations", verifyJWT, fetchSentInvitations);
export default router;
router.get("/notifications", verifyJWT, notificationHandling);
router.delete("/notifications/:id", verifyJWT, notificationHandling);
router.post("/apply-to-hackathon", verifyJWT, applyToHackathon);
router.get("/developer-profile/:id", fetchDeveloperProfile);
router.delete("/leave-team", verifyJWT, leaveTeam);

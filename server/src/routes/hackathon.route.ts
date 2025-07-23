import Router from "express";
import {
  applyToHackathon,
  createHackathon,
  embedHackathons,
  markWinners,
  viewAllHackathons,
  viewHackathonById,
} from "../controllers/hackathon.controller";
import { verifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../utils/Cloudinary";

const router = Router();

// protected routes
router.post("/apply-to-hackathon", verifyJWT, applyToHackathon);
router.post(
  "/create-hackathon",
  verifyJWT,
  upload.single("poster"),
  createHackathon
);
router.get("/view-all-hackathons-auth", verifyJWT, viewAllHackathons);
router.get("/hackathon-auth/:id", verifyJWT, viewHackathonById);
router.post("/mark-winners", verifyJWT, markWinners);

// unprotected routes
router.get("/view-all-hackathons", viewAllHackathons);
router.get("/hackathon/:id", viewHackathonById);

//cron routes
router.post("/embed-hackathons", embedHackathons);

export default router;

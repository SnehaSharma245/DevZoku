import Router from "express";
import {
  applyToHackathon,
  createHackathon,
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

// unprotected routes
router.get("/view-all-hackathons", viewAllHackathons);
router.get("/hackathon/:id", viewHackathonById);

export default router;

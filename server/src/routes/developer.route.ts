import { Router } from "express";
import { completeDeveloperProfile } from "../controllers/developer.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// Protected route for completing developer profile
router.post("/complete-profile", verifyJWT, completeDeveloperProfile);

export default router;

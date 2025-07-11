import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { developers } from "../db/schema/developer.schema";
import { organizers } from "../db/schema/organizer.schema";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { refreshAccessToken } from "../controllers/user.controller";
import { users } from "../db/schema/user.schema";

interface JwtPayload {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  refreshToken?: string | null;
  isProfileComplete?: boolean | null;
}

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.AccessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as JwtPayload;

    const { role, id } = decoded;

    //  Role-based table selection
    const table = role === "developer" ? developers : organizers;

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .then((rows) => rows[0]);

    if (!user) throw new ApiError(401, "User not found");

    //  Fetch user details from the appropriate table
    let developerDetails = null;
    let organizerDetails = null;

    if (role === "developer") {
      developerDetails = await db
        .select({ skills: developers.skills })
        .from(table)
        .where(eq(table.userId, id))
        .then((rows) => rows[0]);
      req.user = {
        ...user,
        developerDetails,
      };
    }

    if (role === "organizer") {
      organizerDetails = await db
        .select()
        .from(table)
        .where(eq(table.userId, id))
        .then((rows) => rows[0]);
      req.user = {
        ...user,
        organizerDetails,
      };
    }

    next();
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

export { verifyJWT };

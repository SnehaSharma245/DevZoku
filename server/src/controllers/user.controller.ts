import { desc, eq, inArray, not } from "drizzle-orm";
import axios from "axios";
import jwt from "jsonwebtoken";

import { db } from "../db/index";
import { developers } from "../db/schema/developer.schema";
import { organizers } from "../db/schema/organizer.schema";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { generateTokens } from "../utils/TokenGeneration";
import { users } from "../db/schema/user.schema";
import { hackathons, teamHackathons } from "../db/schema/hackathon.schema";
import {
  organizerHackathonHistory,
  teamHackathonHistory,
} from "../db/schema/archiveTable.schema";

// Extend Express Request interface
declare module "express" {
  interface Request {
    user?: {
      id: string;
      role: string;
      [key: string]: any;
    };
  }
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

interface GoogleUser {
  id: string;
  email: string;
  given_name: string;
  family_name: string;
  picture?: string;
  verified_email?: boolean;
}

export type Role = "developer" | "organizer";

// Determine user role based on request path
const getRoleFromPath = (path: string): Role => {
  if (path.includes("/api/v1/developer")) {
    return "developer";
  }
  if (path.includes("/api/v1/organizer")) {
    return "organizer";
  }

  return "developer";
};

// Google OAuth login - handles both roles
const googleAuth = asyncHandler(async (req, res) => {
  const role = getRoleFromPath(req.originalUrl);

  const REDIRECT_URI =
    role === "developer"
      ? process.env.GOOGLE_REDIRECT_URI_DEVELOPER ||
        "http://localhost:8000/api/v1/developer/authorization/auth/google/callback"
      : process.env.GOOGLE_REDIRECT_URI_ORGANIZER ||
        "http://localhost:8000/api/v1/organizer/authorization/auth/google/callback";

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
    process.env.GOOGLE_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=profile email&state=${role}&prompt=select_account&access_type=offline`;

  res.redirect(googleAuthUrl);
});

// Google OAuth callback - handles both roles
const signUpWithGoogle = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;
  if (!code) {
    throw new ApiError(400, "Authorization code not provided");
  }

  // Check if the user denied access
  if (error) {
    console.error("Google OAuth error:", error);
    return res.redirect(
      `${process.env.CLIENT_URL || "http://localhost:3000"}?error=access_denied`
    );
  }

  // Use state to determine role, or fall back to path-based detection
  const role =
    (state as "developer" | "organizer") || getRoleFromPath(req.originalUrl);

  const REDIRECT_URI =
    role === "developer"
      ? process.env.GOOGLE_REDIRECT_URI_DEVELOPER ||
        "http://localhost:8000/api/v1/developer/authorization/auth/google/callback"
      : process.env.GOOGLE_REDIRECT_URI_ORGANIZER ||
        "http://localhost:8000/api/v1/organizer/authorization/auth/google/callback";

  // Exchange code for access token
  const tokenResponse = await axios.post<GoogleTokenResponse>(
    "https://oauth2.googleapis.com/token",
    {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code: code as string,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  // Get user info from Google
  const userResponse = await axios.get<GoogleUser>(
    `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.data.access_token}`
  );

  // Check if user already exists in our database
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, userResponse.data.email));

  let userObj;

  if (existingUsers.length === 0) {
    // Create new user from Google data
    const newUser = await db
      .insert(users)
      .values({
        email: userResponse.data.email,
        firstName: userResponse.data.given_name,
        lastName: userResponse.data.family_name,
        googleId: userResponse.data.id,
        isProfileComplete: false,
        role: role,
      })
      .returning();

    userObj = newUser[0];

    if (!userObj) {
      throw new ApiError(500, "Failed to create user");
    }

    // Now create profile in respective table with userId
    if (role === "developer") {
      await db.insert(developers).values({
        userId: userObj.id,
      });
    } else if (role === "organizer") {
      await db.insert(organizers).values({
        userId: userObj.id,
      });
    }
  } else {
    if (existingUsers[0] && existingUsers[0].role !== role) {
      throw new ApiError(403, "User already exists with a different role");
    }
    userObj = existingUsers[0];
  }

  if (!userObj) {
    throw new ApiError(404, "User not found");
  }

  // Generate our app tokens
  const { accessToken, refreshToken } = await generateTokens(userObj, role);

  //update user in db with refresh token
  await db
    .update(users)
    .set({ refreshToken, isProfileComplete: false })
    .where(eq(users.id, userObj.id));

  let redirectPath = "";

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  };

  redirectPath =
    role === "developer" ? "/developer/dashboard" : "/organizer/dashboard";
  // Construct full redirect URL
  const fullRedirectUrl = `${
    process.env.CLIENT_URL || "http://localhost:3000"
  }${redirectPath}`;

  res
    .cookie("AccessToken", accessToken, {
      ...options,
      maxAge: process.env.ACCESS_TOKEN_EXPIRY
        ? parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000
        : 15 * 60 * 60 * 1000,
    })
    .cookie("RefreshToken", refreshToken, {
      ...options,
      maxAge: process.env.REFRESH_TOKEN_EXPIRY
        ? parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000
        : 1 * 24 * 60 * 60 * 1000,
    })
    .redirect(fullRedirectUrl);
});

// Get current user - handles both roles
const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  const { role, id } = req.user;

  // Fetch from users table
  const userResult = await db.select().from(users).where(eq(users.id, id));
  const user = userResult[0];

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  //Fetch from developer/organizer table
  const table = role === "developer" ? developers : organizers;

  const profile = await db
    .select()
    .from(table)
    .where(eq(table.userId, id))
    .then((rows) => rows[0]);

  if (!profile) {
    throw new ApiError(404, "User profile not found");
  }

  const { password, refreshToken, ...safeUser } = user;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...safeUser,
        profile,
        role,
      },
      "Current user fetched successfully"
    )
  );
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.role || !req.user.id) {
    throw new ApiError(401, "User not authenticated");
  }

  const { id } = req.user;

  // Clear refresh token
  await db.update(users).set({ refreshToken: null }).where(eq(users.id, id));

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
  };

  return res
    .status(200)
    .clearCookie("AccessToken", options)
    .clearCookie("RefreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// Refresh token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.RefreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    //  Verify token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as { id: string; role: "developer" | "organizer" };

    const { id, role } = decodedToken;

    if (!id || !role) {
      throw new ApiError(401, "Invalid refresh token");
    }

    //  Get actual user from `users` table
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .then((rows) => rows[0]);

    if (
      !user ||
      user.refreshToken !== incomingRefreshToken ||
      user.role !== role
    ) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      user,
      role
    );

    //save new refresh token in db
    const savedRefreshToken = await db
      .update(users)
      .set({ refreshToken: newRefreshToken })
      .where(eq(users.id, id));

    if (!savedRefreshToken) {
      throw new ApiError(500, "Failed to update refresh token in database");
    }

    // Set cookies
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
    };

    res
      .cookie("AccessToken", accessToken, {
        ...options,
        maxAge: process.env.ACCESS_TOKEN_EXPIRY
          ? parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000
          : 15 * 60 * 60 * 1000,
      })
      .cookie("RefreshToken", newRefreshToken, {
        ...options,
        maxAge: process.env.REFRESH_TOKEN_EXPIRY
          ? parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000
          : 1 * 24 * 60 * 60 * 1000,
      })
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken, role },
          "Access token refreshed"
        )
      );
  } catch (error: any) {
    console.error("Refresh token error:", error.message);
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// View all Hackathons
const viewAllHackathons = asyncHandler(async (req, res) => {
  const allHackathons = await db
    .select()
    .from(hackathons)
    .where(not(eq(hackathons.status, "completed")))
    .orderBy(desc(hackathons.startTime))
    .execute();

  return res
    .status(200)
    .json(
      new ApiResponse(200, allHackathons, "Hackathons fetched successfully")
    );
});

// delete completed hackathons and save them in archive
const deleteCompletedHackathons = asyncHandler(async (req, res) => {
  await db.transaction(async (tx) => {
    const hackathonsToBeDeleted = await tx
      .select()
      .from(hackathons)
      .where(eq(hackathons.status, "completed"))
      .execute();

    if (hackathonsToBeDeleted.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, {}, "No completed hackathons found to delete")
        );
    }

    //store them in archive
    const archiveRows = hackathonsToBeDeleted.map((h) => ({
      hackathonId: h.id,
      title: h.title,
      dateCompleted: h.endTime,
      organizerId: h.createdBy,
    }));

    await tx.insert(organizerHackathonHistory).values(archiveRows);

    const hackathonIds = hackathonsToBeDeleted.map((h) => h.id);

    const teamsToArchive = await tx
      .select()
      .from(teamHackathons)
      .where(inArray(teamHackathons.hackathonId, hackathonIds))
      .execute();

    if (teamsToArchive.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            {},
            "No completed team hackathons found to delete"
          )
        );
    }

    const teamArchiveRows = teamsToArchive.map((t) => ({
      teamId: t.teamId,
      hackathonId: t.hackathonId,
      submittedAt: t.submittedAt,
      score: t.score,
      isWinner: t.isWinner,
      dateCompleted: t.submittedAt,
      rank: 0,
    }));

    if (teamArchiveRows.length > 0) {
      await tx.insert(teamHackathonHistory).values(teamArchiveRows);
    }

    // Delete completed hackathons
    await tx
      .delete(teamHackathons)
      .where(inArray(teamHackathons.hackathonId, hackathonIds));

    await tx.delete(hackathons).where(inArray(hackathons.id, hackathonIds));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "Completed hackathons archived and deleted successfully"
        )
      );
  });
});

export {
  googleAuth,
  signUpWithGoogle,
  getCurrentUser,
  logoutUser,
  refreshAccessToken,
  viewAllHackathons,
  deleteCompletedHackathons,
};

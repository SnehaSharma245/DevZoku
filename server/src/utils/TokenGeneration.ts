import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { ApiError } from "./ApiError";
import { users } from "../db/schema/user.schema";

// Define interfaces for both user types
interface Developer {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  googleId: string | null;
  refreshToken?: string | null;
  isProfileComplete?: boolean | null;
  // Include other fields from your schema as needed
}

interface Organizer {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  googleId: string | null;
  refreshToken?: string | null;
  isProfileComplete?: boolean | null;
  // Include other fields from your schema as needed
}

// Define token payload interface
interface TokenPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "developer" | "organizer";
  refreshToken?: string | null;
  isProfileComplete?: boolean | null;
}

// Define refresh token payload interface
interface RefreshTokenPayload {
  id: string;
  role: "developer" | "organizer";
}

// Define Google user interface
export interface DbUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  googleId: string | null;
  isProfileComplete: boolean | null;
  role: string;
  refreshToken?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export const generateAccessToken = (
  user: Developer | Organizer,
  role: "developer" | "organizer"
): string => {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName || "",
    role,
    refreshToken: user.refreshToken || null,
    isProfileComplete: user.isProfileComplete || false,
  };

  return jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        ? parseInt(process.env.ACCESS_TOKEN_EXPIRY)
        : 15 * 60, // default to 15 hours in seconds
    } as SignOptions
  );
};

export const generateRefreshToken = (
  user: Developer | Organizer,
  role: "developer" | "organizer"
): string => {
  const payload: RefreshTokenPayload = {
    id: user.id,
    role,
  };

  return jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        ? parseInt(process.env.REFRESH_TOKEN_EXPIRY)
        : 1 * 24 * 60 * 60, // default to 1 day in seconds
    } as SignOptions
  );
};

const generateTokens = async (
  userObj: DbUser,
  role: "developer" | "organizer"
): Promise<{
  accessToken: string;
  refreshToken: string;
  user: Developer | Organizer;
}> => {
  try {
    const accessToken = generateAccessToken(userObj, role);
    const refreshToken = generateRefreshToken(userObj, role);

    return { accessToken, refreshToken, user: userObj };
  } catch (error) {
    console.error("OAuth Token Generation Error:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating Google OAuth tokens"
    );
  }
};

export {
  generateTokens,
  type Developer,
  type Organizer,
  type TokenPayload,
  type RefreshTokenPayload,
};

import { eq } from "drizzle-orm";
import { db } from "../db";
import { organizers } from "../db/schema/organizer.schema";
import { users } from "../db/schema/user.schema";
import { ApiResponse } from "../utils/ApiResponse";
import { completeOrganizerProfileSchema } from "../zod-schema/organizer.schema";
import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

const completeOrganizerProfile = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { user } = req;
      const { body } = req;

      if (!user) {
        throw new ApiError(401, "User not authenticated");
      }

      if (user?.role !== "organizer") {
        throw new ApiError(
          403,
          "Access denied. Only organizers can complete profiles."
        );
      }

      // Validate the data against schema
      const validatedData = completeOrganizerProfileSchema.parse(body);

      // Update the organizer profile
      const updatedProfile = await db
        .update(organizers)
        .set({
          organizationName: validatedData.organizationName,
          bio: validatedData.bio,
          website: validatedData.website,
          companyEmail: validatedData.companyEmail,
          phoneNumber: validatedData.phoneNumber,
          socialLinks: validatedData.socialLinks,
          location: validatedData.location,
          isProfileComplete: true,
          updatedAt: new Date(),
        })
        .where(eq(organizers.userId, user.id))
        .returning();

      // Return the updated profile
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedProfile[0],
            "Organizer profile updated successfully ✅"
          )
        );
    } catch (error: any) {
      console.error("Error updating organizer profile:", error);

      if (error.name === "ZodError") {
        throw new ApiError(400, `Validation error: ${error.errors[0].message}`);
      }

      throw new ApiError(
        error.statusCode || 500,
        error.message || "Something went wrong while updating the profile"
      );
    }
  }
);

export { completeOrganizerProfile };

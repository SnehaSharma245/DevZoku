import { desc, eq, is } from "drizzle-orm";
import { db } from "../db";
import { organizers } from "../db/schema/organizer.schema";
import { users } from "../db/schema/user.schema";
import { ApiResponse } from "../utils/ApiResponse";
import { completeOrganizerProfileSchema } from "../zod-schema/organizer.schema";
import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { hackathons } from "../db/schema/hackathon.schema";

// Controller for completing organizer profile
const completeOrganizerProfile = asyncHandler(async (req, res) => {
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

    // Check if profile is complete (address ka check hata diya)
    const isProfileComplete =
      !!validatedData.organizationName &&
      !!validatedData.companyEmail &&
      !!validatedData.phoneNumber &&
      !!validatedData.location &&
      !!validatedData.location.country &&
      !!validatedData.location.state &&
      !!validatedData.location.city;

    // Update the organizer profile (location field hata diya)
    const updatedProfile = await db
      .update(organizers)
      .set({
        organizationName: validatedData.organizationName,
        bio: validatedData.bio,
        website: validatedData.website,
        companyEmail: validatedData.companyEmail,
        socialLinks: validatedData.socialLinks,
        phoneNumber: validatedData.phoneNumber,
        updatedAt: new Date(),
      })
      .where(eq(organizers.userId, user.id))
      .returning();

    // Update user's location (address yahan store hoga)
    await db
      .update(users)
      .set({
        isProfileComplete,
        location: {
          country: validatedData.location.country,
          state: validatedData.location.state,
          city: validatedData.location.city,
          address: validatedData.location.address || "",
        },
      })
      .where(eq(users.id, user.id));

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
    throw new ApiError(500, "Something went wrong while updating the profile");
  }
});

// controller for fetching organizer profile
const fetchOrganizerProfile = asyncHandler(async (req, res) => {
  const { user } = req;

  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Organizer ID is required");
  }

  const organizerProfile = await db
    .select()
    .from(organizers)
    .where(eq(organizers.userId, id as string))
    .then((results) => results[0]);

  let location = null;

  // get location details from users table
  if (organizerProfile) {
    const userProfile = await db
      .select()
      .from(users)
      .where(eq(users.id, organizerProfile.userId as string))
      .then((results) => results[0]);

    if (userProfile) {
      location = userProfile.location;
    }
  }

  if (!organizerProfile) {
    throw new ApiError(404, "Organizer profile not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { organizerProfile, location },
        "Organizer profile fetched successfully"
      )
    );
});

const fetchHackathonsOrganized = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Organizer ID is required");
  }

  const retrievedUser = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .execute();

  if (!retrievedUser || retrievedUser.length === 0) {
    throw new ApiError(404, "User not found");
  }

  // fetch latest 5 hackathons organized by the user

  const organizedHackathons = await db
    .select()
    .from(hackathons)
    .where(eq(hackathons.createdBy, id))
    .orderBy(desc(hackathons.createdAt))
    .limit(5)
    .execute();

  if (!organizedHackathons || organizedHackathons.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(404, [], "No hackathons organized by this user"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        organizedHackathons,
        "Hackathons organized fetched successfully"
      )
    );
});

export {
  completeOrganizerProfile,
  fetchOrganizerProfile,
  fetchHackathonsOrganized,
};

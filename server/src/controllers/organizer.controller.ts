import { eq } from "drizzle-orm";
import { db } from "../db";
import { organizers } from "../db/schema/organizer.schema";
import { users } from "../db/schema/user.schema";
import { ApiResponse } from "../utils/ApiResponse";
import { completeOrganizerProfileSchema } from "../zod-schema/organizer.schema";
import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { hackathonPhases, hackathons } from "../db/schema/hackathon.schema";

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

// controller for creating hackathon
const createHackathon = asyncHandler(async (req: Request, res: Response) => {
  const { user, body } = req;
  const posterUrl = req.file?.path || "";

  if (!user) throw new ApiError(401, "User not authenticated");
  if (user.role !== "organizer")
    throw new ApiError(
      403,
      "Access denied. Only organizers can create hackathons."
    );

  //existing hackathon check
  const existingHackathon = await db
    .select()
    .from(hackathons)
    .where(eq(hackathons.title, body.title))
    .then((results) => results[0]);

  if (existingHackathon) {
    throw new ApiError(400, "Hackathon with this title already exists");
  }

  // Validate hackathon times
  const hackStart = new Date(body.startTime);
  const hackEnd = new Date(body.endTime);
  const now = new Date();

  if (hackStart >= hackEnd)
    throw new ApiError(400, "Start time must be before end time");
  if (hackStart < now || hackEnd < now)
    throw new ApiError(400, "Start time and end time must be in the future");

  // Transaction for hackathon + phases
  const result = await db.transaction(async (tx) => {
    let tags = req.body.tags;
    if (typeof tags === "string") {
      try {
        tags = JSON.parse(tags);
      } catch {
        tags = [];
      }
    }
    if (!Array.isArray(tags)) tags = [];

    const [newHackathon] = await tx
      .insert(hackathons)
      .values({
        title: body.title,
        description: body.description,
        startTime: hackStart,
        endTime: hackEnd,
        createdBy: user.id,
        createdAt: now,
        status: "upcoming",
        tags: tags,
        poster: posterUrl,
        minTeamSize: body.minTeamSize,
        maxTeamSize: body.maxTeamSize,
        mode: body.mode,
      })
      .returning();

    if (!newHackathon) throw new ApiError(500, "Failed to create hackathon");

    // If phases provided, validate and insert
    if (Array.isArray(body.phases) && body.phases.length > 0) {
      const phases = body.phases.map((phase: any) => ({
        hackathonId: newHackathon.id,
        name: phase.name,
        description: phase.description,
        startTime: new Date(phase.startTime),
        endTime: new Date(phase.endTime),
        order: phase.order,
        createdAt: now,
      }));

      // Phase validations
      for (const phase of phases) {
        if (phase.startTime >= phase.endTime)
          throw new ApiError(400, "Phase start time must be before end time");
        if (phase.startTime < now || phase.endTime < now)
          throw new ApiError(
            400,
            "Phase start time or end time must be in the future"
          );
        if (phase.startTime < hackStart || phase.endTime > hackEnd)
          throw new ApiError(
            400,
            "Each phase's start and end time must be within the hackathon's start and end time"
          );
      }

      const phaseInsertion = await tx.insert(hackathonPhases).values(phases);
      if (!phaseInsertion)
        throw new ApiError(500, "Failed to create hackathon phases");
    }

    // Return the newly created hackathon
    return newHackathon;
  });

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Hackathon created successfully ✅"));
});
export { completeOrganizerProfile, createHackathon };

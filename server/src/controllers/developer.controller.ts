import { eq } from "drizzle-orm";
import { db } from "../db";
import { developers } from "../db/schema/developer.schema";
import { ApiResponse } from "../utils/ApiResponse";
import { completeDeveloperProfileSchema } from "../zod-schema/developer.schema";
import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { teams } from "../db/schema/team.schema";

// Controller to handle completing a developer's profile
const completeDeveloperProfile = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { user, body } = req;

      if (!user) {
        throw new ApiError(401, "User not authenticated");
      }

      if (user?.role !== "developer") {
        throw new ApiError(
          403,
          "Access denied. Only developers can complete profiles."
        );
      }

      // Validate the data against schema
      const validatedData = completeDeveloperProfileSchema.parse(body);

      // Check projects validity (if any exist)
      // Projects are not required, but if provided, each project needs title, description, and techStack
      const hasValidProjects =
        !validatedData.projects || // If not provided, valid
        (Array.isArray(validatedData.projects) &&
          validatedData.projects.every((project) => {
            if (!project) return false;

            const titleValid =
              typeof project.title === "string" && project.title.trim() !== "";

            const descValid =
              typeof project.description === "string" &&
              project.description.trim() !== "";

            const techValid =
              Array.isArray(project.techStack) &&
              project.techStack.length > 0 &&
              project.techStack.every(
                (tech) => typeof tech === "string" && tech.trim() !== ""
              );

            return titleValid && descValid && techValid;
          }));

      if (!hasValidProjects) {
        throw new ApiError(
          400,
          "If projects are provided, each project must have a title, description, and tech stack"
        );
      }

      // Update the developer profile
      const updatedProfile = await db
        .update(developers)
        .set({
          title: validatedData.title,
          bio: validatedData.bio,
          skills: validatedData.skills,
          isAvailable: validatedData.isAvailable ?? false,
          socialLinks: validatedData.socialLinks,
          projects: validatedData.projects || [],
          location: validatedData.location,
          updatedAt: new Date(),
        })
        .where(eq(developers.userId, user.id))
        .returning();

      // Return the updated profile
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedProfile[0],
            "Profile updated successfully ✅"
          )
        );
    } catch (error: any) {
      console.error("Error updating developer profile:", error);

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

// Controller to create a team
const createTeam = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { user, body } = req;

    if (!user) {
      throw new ApiError(401, "User not authenticated");
    }

    if (user?.role !== "developer") {
      throw new ApiError(
        403,
        "Access denied. Only developers can create teams."
      );
    }

    //check if the team name is unique or not
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.name, body.name))
      .limit(1)
      .execute();

    if (existingTeam.length > 0) {
      throw new ApiError(400, "Team name must be unique");
    }

    // Create the team
    const newTeam = await db
      .insert(teams)
      .values({
        name: body.name,
        description: body.description,
        teamSize: body.teamSize,
        isAcceptingInvites: body.isAcceptingInvites ?? true,
        createdBy: user.id,
        skillsNeeded: body.skillsNeeded || "",
        captainId: user.id,
        createdAt: new Date(),
      })
      .returning();

    return res
      .status(201)
      .json(new ApiResponse(201, newTeam[0], "Team created successfully"));
  } catch (error: any) {
    console.error("Error creating team:", error);

    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while creating the team"
    );
  }
});

const checkTeamNameUnique = asyncHandler(
  async (req: Request, res: Response) => {
    const { teamName } = req.query;

    if (
      !teamName ||
      typeof teamName !== "string" ||
      teamName.trim() === "" ||
      teamName.length < 3
    ) {
      return res
        .status(200)
        .json(new ApiResponse(200, { isUnique: false }, "Invalid Team Name"));
    }

    // Check if the team name is unique
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.name, teamName))
      .limit(1)
      .execute();

    if (existingTeam.length > 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, { isUnique: false }, "Team name is taken"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { isUnique: true }, "Team name is available"));
  }
);

export { completeDeveloperProfile, createTeam, checkTeamNameUnique };

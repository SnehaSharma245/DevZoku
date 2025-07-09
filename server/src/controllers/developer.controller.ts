import { eq, desc, and } from "drizzle-orm";
import { db } from "../db";
import { developers } from "../db/schema/developer.schema";
import { ApiResponse } from "../utils/ApiResponse";
import { completeDeveloperProfileSchema } from "../zod-schema/developer.schema";
import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { teamMembers, teams } from "../db/schema/team.schema";
import { users } from "../db/schema/user.schema";

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

    if (newTeam.length === 0) {
      throw new ApiError(500, "Failed to create the team");
    }

    if (!newTeam[0]?.id) {
      throw new ApiError(500, "Failed to create the team");
    }

    const addIntoTeamMember = await db
      .insert(teamMembers)
      .values({
        teamId: newTeam[0]?.id,
        userId: user.id,
      })
      .execute();

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

// Controller to check if a team name is unique
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

// controller to get joined teams
const getJoinedTeams = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;

  if (!user) {
    throw new ApiError(401, "User not authenticated");
  }

  const joinedTeams = await db
    .select()
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, user.id))
    .execute();

  return res
    .status(200)
    .json(
      new ApiResponse(200, joinedTeams, "Joined teams fetched successfully")
    );
});

// controller to view all teams and a particular team by ID
const viewAllTeams = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;
  const { id } = req.params;

  if (!user) {
    throw new ApiError(401, "User not authenticated");
  }

  const allTeams = await db
    .select({ team: teams, captain: users })
    .from(teams)
    .orderBy(desc(teams.createdAt))
    .innerJoin(users, eq(teams.captainId, users.id))
    .execute();

  const particularTeam = allTeams.find((team) => team.team.id === id);

  if (id && !particularTeam) {
    throw new ApiError(404, "Team not found");
  }

  if (id && particularTeam) {
    console.log("Particular Team:", particularTeam);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          particularTeam,
          "Particular team fetched successfully"
        )
      );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, allTeams, "All teams fetched successfully"));
});

// controller for joining a team via invitation
const joinInvitation = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;
  const { teamId } = req.body;

  if (!user) {
    throw new ApiError(401, "User not authenticated");
  }

  if (user.role !== "developer") {
    throw new ApiError(403, "Access denied. Only developers can join teams.");
  }

  // check if the team exists
  const existingTeam = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1)
    .execute();

  if (existingTeam.length === 0) {
    throw new ApiError(404, "Team not found");
  }

  //check if the team is accepting invites
  if (!existingTeam[0]?.isAcceptingInvites) {
    throw new ApiError(400, "This team is not accepting invites at the moment");
  }

  //check if the user is already a member of the team
  const existingMember = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, teamId)))
    .limit(1)
    .execute();

  if (existingMember.length > 0) {
    throw new ApiError(400, "You are already a member of this team");
  }

  // Add the user to the team
  const insertionResponse = await db
    .insert(teamMembers)
    .values({ teamId: teamId, userId: user.id })
    .returning();

  if (insertionResponse.length === 0) {
    throw new ApiError(500, "Failed to join the team");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, insertionResponse[0], "Successfully joined the team")
    );
});

export {
  completeDeveloperProfile,
  createTeam,
  checkTeamNameUnique,
  getJoinedTeams,
  viewAllTeams,
  joinInvitation,
};

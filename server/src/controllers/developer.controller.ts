import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { developers } from "../db/schema/developer.schema";
import { ApiResponse } from "../utils/ApiResponse";
import { completeDeveloperProfileSchema } from "../zod-schema/developer.schema";
import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { teamMembers, teams } from "../db/schema/team.schema";
import { users } from "../db/schema/user.schema";
import { io } from "..";

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
const sendInvitation = asyncHandler(async (req: Request, res: Response) => {
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

  // check if the user has already sent an invitation to the team
  const existingInvitation = existingTeam[0]?.pendingInvitesFromUsers?.includes(
    user.id
  );

  if (existingInvitation) {
    throw new ApiError(400, "You have already sent an invitation to this team");
  }

  const sendInvitation = await db
    .update(teams)
    .set({
      pendingInvitesFromUsers: existingTeam[0]?.pendingInvitesFromUsers
        ? [...existingTeam[0].pendingInvitesFromUsers, user.id]
        : [user.id],
    })
    .where(eq(teams.id, teamId))
    .returning();

  if (!sendInvitation || sendInvitation.length === 0) {
    throw new ApiError(500, "Failed to send the invitation");
  }

  //fetch every member of the team and send them a notification
  const teamMembersList = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId))
    .execute();

  // --- Notification logic ---
  const notification = {
    id: crypto.randomUUID(),
    type: "invitation-sent" as "invitation-sent",
    message: `${user.firstName} has sent an invitation to join the team ${sendInvitation[0]?.name}`,
    createdAt: new Date().toISOString(),
    teamId: teamId,
  };

  teamMembersList.forEach((member) => {
    io.to(member.userId).emit("new-invitation", notification);
  });

  // store notification in the database (fetch + push + update)
  for (const member of teamMembersList) {
    const [dev] = await db
      .select({ notifications: developers.notifications })
      .from(developers)
      .where(eq(developers.userId, member.userId))
      .limit(1)
      .execute();

    const updatedNotifications = [...(dev?.notifications ?? []), notification];

    const savedNotificationInTeamMembers = await db
      .update(developers)
      .set({ notifications: updatedNotifications })
      .where(eq(developers.userId, member.userId))
      .execute();

    if (!savedNotificationInTeamMembers) {
      throw new ApiError(
        500,
        "Failed to save notification in the database for team member"
      );
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        sendInvitation[0],
        "Inivitation forwarded successfully"
      )
    );
});

// controller to fetch pending invites and accepting them
const fetchPendingInvitesAndAcceptThem = asyncHandler(
  async (req: Request, res: Response) => {
    const { user } = req;
    const { teamId } = req.params;
    const { pendingUserId } = req.query;

    if (!user) throw new ApiError(401, "User not authenticated");
    if (!teamId) throw new ApiError(400, "Team ID is required");

    // Fetch team
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .execute();

    if (!team) {
      return res
        .status(200)
        .json(
          new ApiResponse(200, [], "No pending invites found for this team")
        );
    }

    const pendingUserIds = team.pendingInvitesFromUsers ?? [];

    // Fetch pending users
    const pendingUsers = await db
      .select({ firstName: users.firstName, email: users.email, id: users.id })
      .from(users)
      .where(inArray(users.id, pendingUserIds))
      .execute();

    // If no pendingUserId, just return pending invites
    if (!pendingUserId) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { pendingUsers, teamName: team.name },
            "Pending invites fetched successfully"
          )
        );
    }

    // Only captain can accept
    if (user.id !== team.captainId) {
      throw new ApiError(400, "Only the team captain can accept invites");
    }

    // Add user to teamMembers
    const addedPendingUser = await db
      .insert(teamMembers)
      .values({
        teamId: teamId as string,
        userId: pendingUserId as string,
      })
      .execute();

    if (!addedPendingUser) {
      throw new ApiError(500, "Failed to add user to the team");
    }

    // --- Notification logic ---
    const notification = {
      id: crypto.randomUUID(),
      type: "invitation-accepted" as "invitation-accepted",
      message: `You have been added to the team ${team.name}`,
      createdAt: new Date().toISOString(),
      teamId: teamId as string,
    };

    // 1. Real-time notification
    io.to(pendingUserId as string).emit("invitation-accepted", notification);

    // 2. Persist notification in DB
    const [dev] = await db
      .select({ notifications: developers.notifications })
      .from(developers)
      .where(eq(developers.userId, pendingUserId as string))
      .limit(1)
      .execute();

    const updatedNotifications = [...(dev?.notifications ?? []), notification];

    const notificationInDb = await db
      .update(developers)
      .set({ notifications: updatedNotifications })
      .where(eq(developers.userId, pendingUserId as string))
      .execute();

    if (!notificationInDb) {
      throw new ApiError(500, "Failed to save notification in the database");
    }

    // Remove user from pending invites
    const updatedPendingInvites = pendingUserIds.filter(
      (id) => id !== (pendingUserId as string)
    );

    const removedPendingInvite = await db
      .update(teams)
      .set({ pendingInvitesFromUsers: updatedPendingInvites })
      .where(eq(teams.id, teamId))
      .execute();

    if (!removedPendingInvite) {
      throw new ApiError(500, "Failed to remove user from pending invites");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          addedPendingUser,
          "User added to the team successfully"
        )
      );
  }
);

// controller for fetching all the sent invitations
const fetchSentInvitations = asyncHandler(
  async (req: Request, res: Response) => {
    const { user } = req;
    if (!user) {
      throw new ApiError(401, "User not authenticated");
    }

    const sentInvitations = await db
      .select()
      .from(teams)
      .where(sql`${user.id} = ANY(${teams.pendingInvitesFromUsers})`)
      .execute();

    if (!sentInvitations) {
      throw new ApiError(404, "No sent invitations found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          sentInvitations,
          "Sent invitations fetched successfully"
        )
      );
  }
);

const notificationHandling = asyncHandler(
  async (req: Request, res: Response) => {
    const { user } = req;
    const { id } = req.params;
    if (!user) {
      throw new ApiError(401, "User not authenticated");
    }

    // Fetch the developer's notifications
    const [dev] = await db
      .select({ notifications: developers.notifications })
      .from(developers)
      .where(eq(developers.userId, user.id))
      .limit(1)
      .execute();

    if (!dev) {
      throw new ApiError(404, "Developer not found");
    }

    if (dev?.notifications?.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No notifications found"));
    }

    if (id) {
      // find the notification by id and delete it
      const updatedNotifications = dev.notifications?.filter(
        (notification) => notification.id !== id
      );

      const notificationAfterRemoval = await db
        .update(developers)
        .set({ notifications: updatedNotifications })
        .where(eq(developers.userId, user.id))
        .execute();

      if (!notificationAfterRemoval) {
        throw new ApiError(500, "Failed to delete notification");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Notification deleted successfully"));
    }

    return res.status(200).json({
      status: 200,
      data: dev.notifications,
      message: "Notifications fetched successfully",
    });
  }
);

export {
  completeDeveloperProfile,
  createTeam,
  checkTeamNameUnique,
  getJoinedTeams,
  viewAllTeams,
  sendInvitation,
  fetchPendingInvitesAndAcceptThem,
  fetchSentInvitations,
  notificationHandling,
};

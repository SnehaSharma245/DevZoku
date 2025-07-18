import { eq, desc, and, inArray, sql, name } from "drizzle-orm";
import { db } from "../db";
import { developers } from "../db/schema/developer.schema";
import { ApiResponse } from "../utils/ApiResponse";
import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { teamMembers, teams } from "../db/schema/team.schema";
import { users } from "../db/schema/user.schema";
import { io } from "..";
import { hackathons, teamHackathons } from "../db/schema/hackathon.schema";
import { hackathonTeamEmailQueue } from "../queues/queue";
import formatDate from "../utils/formatDate";
import { organizers } from "../db/schema/organizer.schema";

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

/// controller to get joined teams
const getJoinedTeams = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;

  if (!user) {
    throw new ApiError(401, "User not authenticated");
  }

  // Get all teams the user is a member of
  const joinedTeams = await db
    .select({
      teams: {
        ...teams,
        currentMemberCount: sql<number>`(
        SELECT COUNT(*) FROM ${teamMembers}
        WHERE ${teamMembers.teamId} = ${teams.id}
      )`,
      },
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, user.id))
    .execute();

  // fetch the team IDs for further use if needed
  const teamIds = joinedTeams.map((jt) => jt.teams.id);

  const allMembers = await db
    .select({
      userId: teamMembers.userId,
      teamId: teamMembers.teamId,
      name: sql<string>`"users"."first_name" || ' ' || COALESCE("users"."last_name", '')`,
      email: users.email,
    })
    .from(teamMembers)
    .innerJoin(users, eq(users.id, teamMembers.userId))
    .where(inArray(teamMembers.teamId, teamIds))
    .execute();

  const membersByTeam: Record<string, any[]> = {};
  allMembers.forEach((member) => {
    if (!membersByTeam[member.teamId]) {
      membersByTeam[member.teamId] = [];
    }
    (membersByTeam[member.teamId] ??= []).push(member);
  });

  const joinedTeamsWithMembers = joinedTeams.map((jt) => ({
    ...jt,
    team_members: membersByTeam[jt.teams.id] || [],
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        joinedTeamsWithMembers,
        "Joined teams fetched successfully"
      )
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

// controller to leave the team
const leaveTeam = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;

  if (!user) {
    throw new ApiError(401, "User not authenticated");
  }

  const { teamId } = req.body;

  if (!teamId) {
    throw new ApiError(400, "Team ID is required");
  }

  const existingMember = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, teamId)))
    .limit(1)
    .execute();

  if (existingMember.length === 0) {
    throw new ApiError(404, "User is not a member of this team");
  }

  // if the team and user is currently the part of active hackathon, we will not allow them to leave the team
  const userInActiveHackathon = await db
    .select()
    .from(teamHackathons)
    .where(and(eq(teamHackathons.teamId, teamId)))
    .limit(1)
    .execute();

  if (userInActiveHackathon.length > 0) {
    throw new ApiError(
      400,
      "You cannot leave the team while participating in an active hackathon"
    );
  }

  // Remove the user from the team
  const deletedMember = await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, teamId)))
    .execute();

  if (!deletedMember) {
    throw new ApiError(500, "Failed to leave the team");
  }

  // check if the team length is 0 after leaving the team
  const teamMembersCount = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId))
    .execute();

  // delete the team if no member left
  if (teamMembersCount.length === 0) {
    const deletedTeam = await db
      .delete(teams)
      .where(eq(teams.id, teamId))
      .execute();

    if (!deletedTeam) {
      throw new ApiError(500, "Failed to delete the team");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          "Left team successfully and team deleted as no members left"
        )
      );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Left team successfully"));
});

export {
  createTeam,
  checkTeamNameUnique,
  getJoinedTeams,
  viewAllTeams,
  sendInvitation,
  fetchPendingInvitesAndAcceptThem,
  fetchSentInvitations,
  leaveTeam,
};

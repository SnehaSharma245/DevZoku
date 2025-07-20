import { eq, and, inArray, sql, desc, gt } from "drizzle-orm";
import { db } from "../db";
import { ApiResponse } from "../utils/ApiResponse";
import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { teamMembers, teams } from "../db/schema/team.schema";
import { users } from "../db/schema/user.schema";
import { io } from "..";
import {
  hackathonPhases,
  hackathons,
  teamHackathons,
} from "../db/schema/hackathon.schema";
import { hackathonTeamEmailQueue } from "../queues/queue";
import formatDate from "../utils/formatDate";
import { organizers } from "../db/schema/organizer.schema";
import hackathonStatusChecker from "../utils/hackathonStatusChecker";
import {
  userHackathonViews,
  userInteractions,
} from "../db/schema/userInteraction.schema";

// controller for applying to a hackathon with a team
const applyToHackathon = asyncHandler(async (req: Request, res: Response) => {
  const { user } = req;
  if (!user) {
    throw new ApiError(401, "User not authenticated");
  }

  const { hackathonId, teamId } = req.body;

  if (!hackathonId || !teamId) {
    throw new ApiError(400, "Hackathon ID and Team ID are required");
  }

  // Check if the hackathon exists
  const hackathon = await db
    .select()
    .from(hackathons)
    .where(eq(hackathons.id, hackathonId))
    .limit(1)
    .execute();

  if (hackathon.length === 0) {
    throw new ApiError(404, "Hackathon not found");
  }

  // Check if the team exists
  const team = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1)
    .execute();

  if (team.length === 0) {
    throw new ApiError(404, "Team not found");
  }

  const now = new Date();

  // Registration window check
  const regStart = hackathon[0]?.registrationStart
    ? new Date(hackathon[0].registrationStart)
    : null;
  const regEnd = hackathon[0]?.registrationEnd
    ? new Date(hackathon[0].registrationEnd)
    : null;

  if (regStart && now < regStart) {
    throw new ApiError(400, "Registration has not started yet.");
  }
  if (regEnd && now > regEnd) {
    throw new ApiError(400, "Registration period is over.");
  }

  // Hackathon window check (optional, usually registration is before hackathon)
  const hackStart = hackathon[0]?.startTime
    ? new Date(hackathon[0].startTime)
    : null;
  const hackEnd = hackathon[0]?.endTime ? new Date(hackathon[0].endTime) : null;

  if (hackStart && hackEnd && now > hackEnd) {
    throw new ApiError(400, "Hackathon is already over.");
  }

  // check the member count of the team if it exceeds the limit
  const teamMember = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId))
    .execute();

  if (
    !teamMember.length ||
    !hackathon[0] ||
    teamMember.length < hackathon[0].minTeamSize ||
    teamMember.length > hackathon[0].maxTeamSize
  ) {
    throw new ApiError(400, "Team member limit not matching or data missing");
  }

  // Check if the team is already applied to the hackathon
  const existingApplication = await db
    .select()
    .from(teamHackathons)
    .where(
      and(
        eq(teamHackathons.teamId, teamId),
        eq(teamHackathons.hackathonId, hackathonId)
      )
    )
    .limit(1)
    .execute();

  if (existingApplication.length > 0) {
    throw new ApiError(400, "Team has already applied to this hackathon");
  }

  // check if the user is captain of the team
  const isCaptain = await db
    .select()
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.captainId, user.id)))
    .limit(1)
    .execute();

  if (isCaptain.length === 0) {
    throw new ApiError(403, "User is not the captain of the team");
  }

  //check if any of the team members have already applied to the hackathon with other team
  const appliedMembers = await db
    .select()
    .from(teamHackathons)
    .innerJoin(teamMembers, eq(teamHackathons.teamId, teamMembers.teamId))
    .where(
      and(
        eq(teamHackathons.hackathonId, hackathonId),
        inArray(
          teamMembers.userId,
          teamMember.map((m) => m.userId)
        )
      )
    )
    .execute();

  if (appliedMembers.length > 0) {
    throw new ApiError(
      400,
      "Some team members have already applied to this hackathon with another team"
    );
  }

  // Insert the team into the hackathon
  const newApplication = await db
    .insert(teamHackathons)
    .values({ teamId, hackathonId })
    .execute();

  if (!newApplication) {
    throw new ApiError(500, "Failed to apply to hackathon");
  }

  // Notify the team members about the application by email

  //fetch emails from all the team members
  const userIds = teamMember.map((member) => member.userId);

  const emails = await db
    .select({ email: users.email, name: users.firstName })
    .from(users)
    .where(inArray(users.id, userIds))
    .execute();

  const organizer = await db
    .select({
      email: organizers.companyEmail,
      name: organizers.organizationName,
    })
    .from(organizers)
    .where(eq(organizers.userId, hackathon[0].createdBy))
    .limit(1)
    .execute();

  emails.forEach((member) => {
    hackathonTeamEmailQueue.add("send-hackathon-registration-email", {
      email: member.email,
      memberName: member.name,
      teamName: team[0]?.name,
      hackathonName: hackathon[0]?.title,
      hackathonStartDate: formatDate(
        hackathon[0]?.startTime
          ? hackathon[0].startTime.toISOString()
          : undefined
      ),
      hackathonEndDate: formatDate(
        hackathon[0]?.endTime ? hackathon[0].endTime.toISOString() : undefined
      ),
      organizationName: organizer[0]?.name,
      organizationEmail: organizer[0]?.email,
    });
  });

  // add user interaction to all the team members
  for (const member of teamMember) {
    if (member.userId) {
      const recentView = await db
        .select()
        .from(userHackathonViews)
        .where(
          and(
            eq(userHackathonViews.userId, member.userId),
            eq(userHackathonViews.hackathonId, hackathon[0].id),
            gt(
              userHackathonViews.viewedAt,
              new Date(Date.now() - 10 * 60 * 1000)
            )
          )
        )
        .limit(1)
        .execute();
      if (recentView.length === 0) {
        const userInteraction = await db
          .insert(userInteractions)
          .values({
            userId: member.userId,
            interactionType: "register",
            hackathonTagsSearchedFor: [],
            hackathonsRegisteredTags: hackathon[0]?.tags || [],
            preferredDuration:
              hackStart &&
              hackEnd &&
              hackEnd.getTime() - hackStart.getTime() > 0
                ? (
                    (hackEnd.getTime() - hackStart.getTime()) /
                    3600000
                  ).toString()
                : null,
            preferredMode: hackathon[0]?.mode || null,
          })
          .execute();

        if (!userInteraction) {
          throw new ApiError(500, "Failed to log user interaction");
        }

        // Add to user hackathon views
        const newView = await db
          .insert(userHackathonViews)
          .values({
            userId: member.userId,
            hackathonId: hackathon[0].id,
          })
          .execute();
      }
    }
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, newApplication, "Applied to hackathon successfully")
    );
});

// View all Hackathons
const viewAllHackathons = asyncHandler(async (req, res) => {
  const {
    tags,
    duration,
    startDate,
    endDate,
    status,
    mode,
    organizerId,
    showParticipated,
  } = {
    ...req.query,
    ...req.body,
  };

  const devId = req.user?.id;

  let whereClauses = [];

  if (showParticipated && devId) {
    // 1. Get all teamIds where user is a member
    const userTeamIds = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, devId));
    const teamIds = userTeamIds.map((t) => t.teamId);

    if (teamIds.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "Hackathons fetched successfully"));
    }

    // 2. Get all hackathonIds where any of user's teams have applied
    const hackathonIds = await db
      .select({ hackathonId: teamHackathons.hackathonId })
      .from(teamHackathons)
      .where(inArray(teamHackathons.teamId, teamIds));
    const hackIds = hackathonIds.map((h) => h.hackathonId);

    if (hackIds.length === 0) {
      // User has not participated in any hackathon, return empty
      return res
        .status(200)
        .json(new ApiResponse(200, [], "Hackathons fetched successfully"));
    }

    // Sirf participated hackathons pe hi filters lagao
    whereClauses.push(inArray(hackathons.id, hackIds));
  }

  if (organizerId) {
    whereClauses.push(sql`${hackathons.createdBy} = ${organizerId}`);
  }

  let tagArr: string[] = [];
  // Tag filter (comma separated, matches ANY tag)
  if (tags) {
    tagArr = String(tags)
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (tagArr.length > 0) {
      whereClauses.push(
        sql`${hackathons.tags} && ${sql.raw(
          `ARRAY[${tagArr
            .map((t) => `'${t.replace(/'/g, "''")}'`)
            .join(",")}]::varchar[]`
        )}`
      );
    }
  }

  // Duration filter (in hours)
  if (duration) {
    if (duration === "gt72") {
      whereClauses.push(
        sql`EXTRACT(EPOCH FROM (${hackathons.endTime} - ${hackathons.startTime}))/3600 > 72`
      );
    } else {
      whereClauses.push(
        sql`EXTRACT(EPOCH FROM (${hackathons.endTime} - ${
          hackathons.startTime
        }))/3600 <= ${Number(duration)}`
      );
    }
  }

  // Start date filter
  if (startDate) {
    whereClauses.push(sql`${hackathons.startTime} >= ${startDate}`);
  }

  // End date filter
  if (endDate) {
    whereClauses.push(sql`${hackathons.endTime} <= ${endDate}`);
  }

  // Mode filter
  if (mode && (mode === "online" || mode === "offline")) {
    whereClauses.push(sql`${hackathons.mode} = ${mode}`);
  }

  // Fetch all hackathons matching filters
  const allHackathons = await db
    .select()
    .from(hackathons)
    .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
    .orderBy(desc(hackathons.startTime))
    .execute();

  // Calculate status for each hackathon
  const hackathonsWithStatus = allHackathons.map((hack) => {
    const statusValue = hackathonStatusChecker(
      new Date(hack.registrationStart ?? ""),
      new Date(hack.registrationEnd ?? ""),
      new Date(hack.startTime ?? ""),
      new Date(hack.endTime ?? "")
    );
    return { ...hack, status: statusValue };
  });

  // Status filter (after status calculation)
  let filteredHackathons = hackathonsWithStatus;
  if (status && status !== "all") {
    filteredHackathons = hackathonsWithStatus.filter(
      (h) => h.status === status
    );
  }

  // add user interaction to table
  if (
    devId &&
    ((tagArr && tagArr.length > 0) ||
      duration ||
      startDate ||
      endDate ||
      status ||
      mode ||
      organizerId)
  ) {
    const userInteraction = await db
      .insert(userInteractions)
      .values({
        userId: devId,
        interactionType: "search",
        hackathonTagsSearchedFor: tagArr,
        hackathonsRegisteredTags: [],
        preferredDuration: duration ? String(duration) : null,
        preferredMode: mode || null,
      })
      .execute();

    if (!userInteraction) {
      throw new ApiError(500, "Failed to log user interaction");
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        filteredHackathons,
        "Hackathons fetched successfully"
      )
    );
});

// controller for view hackathon by id
const viewHackathonById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let devId;
  if (req.user && req.user.role === "developer") {
    devId = req.user?.id;
  }

  if (!id) {
    throw new ApiError(400, "Hackathon ID is required");
  }

  const hackathonArr = await db
    .select()
    .from(hackathons)
    .where(eq(hackathons.id, id))
    .execute();

  if (hackathonArr.length === 0) {
    throw new ApiError(404, "Hackathon not found");
  }

  const hackathon = hackathonArr[0];

  if (!hackathon) {
    throw new ApiError(404, "Hackathon not found");
  }

  const phases = await db
    .select()
    .from(hackathonPhases)
    .where(eq(hackathonPhases.hackathonId, hackathon?.id))
    .orderBy(hackathonPhases.order)
    .execute();

  const organizer = await db
    .select({
      organizationName: organizers.organizationName,
      userId: organizers.userId,
    })
    .from(organizers)
    .where(eq(organizers.userId, hackathon.createdBy))
    .execute();

  if (organizer.length === 0) {
    throw new ApiError(404, "Organizer not found for this hackathon");
  }

  const duration =
    hackathon.startTime &&
    hackathon.endTime &&
    hackathon.endTime.getTime() - hackathon.startTime.getTime() > 0
      ? (hackathon.endTime.getTime() - hackathon.startTime.getTime()) / 3600000
      : null;

  // save viewed hackathon interaction
  if (devId) {
    const recentView = await db
      .select()
      .from(userHackathonViews)
      .where(
        and(
          eq(userHackathonViews.userId, devId),
          eq(userHackathonViews.hackathonId, hackathon.id),
          gt(userHackathonViews.viewedAt, new Date(Date.now() - 10 * 60 * 1000))
        )
      )
      .limit(1)
      .execute();

    if (recentView.length === 0) {
      const userInteraction = await db
        .insert(userInteractions)
        .values({
          userId: devId,
          interactionType: "view",
          hackathonTagsSearchedFor: [],
          hackathonsRegisteredTags: hackathon.tags || [],
          preferredDuration: duration ? duration.toString() : null,
          preferredMode: hackathon.mode || null,
        })
        .execute();

      if (!userInteraction) {
        throw new ApiError(500, "Failed to log user interaction");
      }

      // Add to user hackathon views
      const newView = await db
        .insert(userHackathonViews)
        .values({
          userId: devId,
          hackathonId: hackathon.id,
        })
        .execute();
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...hackathon, organizer: organizer[0], phases },
        "Hackathon fetched successfully"
      )
    );
});

// controller for creating hackathon
const createHackathon = asyncHandler(async (req: Request, res: Response) => {
  const { user, body } = req;
  const posterUrl = req.file?.path || "";

  if (!posterUrl) {
    throw new ApiError(400, "Poster image is required");
  }

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
  const hackRegStart = new Date(body.registrationStart);
  const hackRegEnd = new Date(body.registrationEnd);

  const now = new Date();

  if (hackStart >= hackEnd)
    throw new ApiError(400, "Start time must be before end time");
  if (hackStart < now || hackEnd < now)
    throw new ApiError(400, "Start time and end time must be in the future");

  if (hackRegStart >= hackRegEnd)
    throw new ApiError(400, "Registration start time must be before end time");
  if (hackRegStart < now || hackRegEnd < now)
    throw new ApiError(400, "Registration times must be in the future");

  // 6. Registration window must be before hackathon window
  if (hackRegStart > hackStart) {
    throw new ApiError(400, "Registration cannot start after hackathon starts");
  }
  if (hackRegEnd > hackStart) {
    throw new ApiError(400, "Registration should end before hackathon starts");
  }

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

    let phases = req.body.phases;
    if (typeof phases === "string") {
      try {
        phases = JSON.parse(phases);
      } catch {
        phases = [];
      }
    }
    if (!Array.isArray(phases)) phases = [];

    const [newHackathon] = await tx
      .insert(hackathons)
      .values({
        title: body.title,
        description: body.description,
        startTime: hackStart,
        endTime: hackEnd,
        createdBy: user.id,
        createdAt: now,
        tags: tags,
        poster: posterUrl,
        minTeamSize: body.minTeamSize,
        maxTeamSize: body.maxTeamSize,
        mode: body.mode,
        registrationStart: hackRegStart,
        registrationEnd: hackRegEnd,
      })
      .returning();

    if (!newHackathon) throw new ApiError(500, "Failed to create hackathon");

    // If phases provided, validate and insert
    if (phases.length > 0) {
      const now = new Date();
      const regStart = new Date(req.body.registrationStart);
      const regEnd = new Date(req.body.registrationEnd);
      const hackStart = new Date(req.body.startTime);
      const hackEnd = new Date(req.body.endTime);

      const phasesToInsert = phases.map((phase: any) => ({
        hackathonId: newHackathon.id,
        name: phase.name,
        description: phase.description,
        startTime: new Date(phase.startTime),
        endTime: new Date(phase.endTime),
        order: phase.order,
        createdAt: now,
      }));

      // Phase validations
      for (const phase of phasesToInsert) {
        if (phase.startTime >= phase.endTime)
          throw new ApiError(400, "Phase start time must be before end time");
        if (phase.startTime < now || phase.endTime < now)
          throw new ApiError(
            400,
            "Phase start time or end time must be in the future"
          );
        if (phase.startTime < regStart || phase.endTime > hackEnd)
          throw new ApiError(
            400,
            "Each phase's start and end time must be within the hackathon's start and end time"
          );
      }

      const phaseInsertion = await tx
        .insert(hackathonPhases)
        .values(phasesToInsert);
      if (!phaseInsertion)
        throw new ApiError(500, "Failed to create hackathon phases");
    }

    // Return the newly created hackathon
    return newHackathon;
  });

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Hackathon created successfully "));
});

export {
  applyToHackathon,
  viewAllHackathons,
  viewHackathonById,
  createHackathon,
};

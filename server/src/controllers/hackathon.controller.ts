import { eq, and, inArray, sql, desc, gt, not } from "drizzle-orm";
import { db } from "../db";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { teamMembers, teams } from "../db/schema/team.schema";
import { users } from "../db/schema/user.schema";
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

import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { initialiseVectorStore } from "../lib/vectorStore";
import { developers } from "../db/schema/developer.schema";

// controller for applying to a hackathon with a team
const applyToHackathon = asyncHandler(async (req, res) => {
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

  if (
    organizer.length === 0 ||
    !organizer[0]?.email ||
    typeof organizer[0].email !== "string" ||
    organizer[0].email === null
  ) {
    throw new ApiError(404, "Organizer not found");
  }

  emails.forEach((member) => {
    // sendTeamRegistrationEmail({
    //   email: member.email,
    //   memberName: member.name,
    //   teamName: team[0]?.name ?? "",
    //   hackathonName: hackathon[0]?.title ?? "",
    //   hackathonStartDate: formatDate(
    //     hackathon[0]?.startTime
    //       ? hackathon[0].startTime.toISOString()
    //       : undefined
    //   ),
    //   hackathonEndDate: formatDate(
    //     hackathon[0]?.endTime ? hackathon[0].endTime.toISOString() : undefined
    //   ),
    //   organizationName: organizer[0]?.name || "",
    //   organizationEmail: organizer[0]?.email ?? "",
    // });

    // add to queue
    hackathonTeamEmailQueue.add("team-registration", {
      email: member.email,
      memberName: member.name,
      teamName: team[0]?.name ?? "",
      hackathonName: hackathon[0]?.title ?? "",
      hackathonStartDate: formatDate(
        hackathon[0]?.startTime
          ? hackathon[0].startTime.toISOString()
          : undefined
      ),
      hackathonEndDate: formatDate(
        hackathon[0]?.endTime ? hackathon[0].endTime.toISOString() : undefined
      ),
      organizationName: organizer[0]?.name || "",
      organizationEmail: organizer[0]?.email ?? "",
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

// controller for Viewing all Hackathons
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
  const { withTeams } = req.query;

  let devId;

  if (req.user && req.user.role === "developer") {
    devId = req.user?.id;
  }
  let orgId;
  if (req.user && req.user.role === "organizer") {
    orgId = req.user?.id;
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

  const statusValue = hackathonStatusChecker(
    new Date(hackathon?.registrationStart ?? ""),
    new Date(hackathon?.registrationEnd ?? ""),
    new Date(hackathon?.startTime ?? ""),
    new Date(hackathon?.endTime ?? "")
  );

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
          hackathonTagsSearchedFor: hackathon.tags || [],
          hackathonsRegisteredTags: [],
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

  if (withTeams === "true" && orgId) {
    // Fetch all teams that have applied to this hackathon

    const teamsApplied = await db
      .select({ teams: teams })
      .from(teams)
      .innerJoin(teamHackathons, eq(teams.id, teamHackathons.teamId))
      .where(eq(teamHackathons.hackathonId, hackathon.id))
      .orderBy(teams.name)
      .execute();

    if (teamsApplied.length === 0) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            ...hackathon,
            organizer: organizer[0],
            phases,
            teamsApplied: [],
            status: statusValue,
          },
          "Hackathon fetched successfully"
        )
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...hackathon,
          organizer: organizer[0],
          phases,
          teamsApplied,
          status: statusValue,
        },
        "Hackathon fetched successfully"
      )
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { ...hackathon, organizer: organizer[0], phases, status: statusValue },
        "Hackathon fetched successfully"
      )
    );
});

// controller for creating hackathon
const createHackathon = asyncHandler(async (req, res) => {
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

    //update organizer's totalHackathons
    const [organizer] = await tx
      .select()
      .from(organizers)
      .where(eq(organizers.userId, user.id))
      .limit(1)
      .execute();

    if (!organizer) {
      throw new ApiError(404, "Organizer not found");
    }

    await tx
      .update(organizers)
      .set({
        totalEventsOrganized: (organizer?.totalEventsOrganized ?? 0) + 1,
      })
      .where(eq(organizers.userId, user.id))
      .returning();

    // Return the newly created hackathon
    return newHackathon;
  });

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Hackathon created successfully "));
});

// controller for creating hackathon embeddings (CRON JOB)
const embedHackathons = asyncHandler(async (req, res) => {
  const CRON_SECRET = process.env.CRON_SECRET;

  if (!CRON_SECRET) {
    throw new ApiError(500, "CRON_SECRET is not set in environment variables");
  }

  const authHeader = req?.headers?.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Unauthorized");
  }

  const submittedSecret = authHeader.substring(7);

  if (submittedSecret !== CRON_SECRET) {
    throw new ApiError(403, "Forbidden: Invalid secret");
  }

  const fetchRecentHackathons = await db
    .select()
    .from(hackathons)
    .where(
      gt(hackathons.createdAt, new Date(Date.now() - 4 * 24 * 60 * 60 * 1000))
    )
    .orderBy(desc(hackathons.createdAt))
    .execute();

  if (fetchRecentHackathons.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "No recent hackathons"));
  }

  const doc = new Document({
    pageContent: JSON.stringify(fetchRecentHackathons),
    metadata: {
      type: "hackathon-embeddings",
      embeddedAt: new Date().toISOString(),
    },
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const splits = await splitter.splitDocuments([doc]);

  const vecStore = await initialiseVectorStore({
    collectionName: "hackathon-embeddings",
  });

  const fiveDaysAgo = new Date(
    Date.now() - 5 * 24 * 60 * 60 * 1000
  ).toISOString();
  // Qdrant example
  try {
    // Fix the delete operation filter syntax
    await vecStore.delete({
      filter: {
        must: [
          {
            key: "metadata.embeddedAt", // Add metadata prefix
            range: {
              lt: fiveDaysAgo, // Use 'lt' instead of 'lte' for less than
            },
          },
        ],
      },
    });
  } catch (error) {
    console.warn("Error deleting old embeddings:", error);
    // Continue with adding new documents even if delete fails
  }

  try {
    await vecStore.addDocuments(splits);
  } catch (error) {
    console.error("Error adding documents to Qdrant:", error);
    throw new ApiError(500, "Failed to add documents to vector store");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Hackathons embedded successfully"));
});

// controller for marking winners
const markWinners = asyncHandler(async (req, res) => {
  const { user } = req;

  if (!user) throw new ApiError(401, "Unauthorized");
  if (user.role !== "organizer")
    throw new ApiError(403, "Only organizers can mark winners");

  const { hackathonId, winners } = req.body;
  if (!hackathonId || !winners) throw new ApiError(400, "Invalid request");

  const hackathon = await db
    .select({ title: hackathons.title, createdBy: hackathons.createdBy })
    .from(hackathons)
    .where(eq(hackathons.id, hackathonId))
    .limit(1)
    .execute();

  if (!hackathon || hackathon.length === 0) {
    throw new ApiError(404, "Hackathon not found");
  }

  // Update hackathon with winners
  const updatedHackathon = await db
    .update(hackathons)
    .set({ positionHolders: winners })
    .where(eq(hackathons.id, hackathonId))
    .execute();

  if (!updatedHackathon) throw new ApiError(500, "Failed to mark winners");

  // Update teamHackathons table for all positions
  const positionMap = [
    { key: "winner", value: "winner" },
    { key: "firstRunnerUp", value: "firstRunnerUp" },
    { key: "secondRunnerUp", value: "secondRunnerUp" },
  ];

  for (const pos of positionMap) {
    if (winners[pos.key]) {
      await db
        .update(teamHackathons)
        .set({
          position: pos.value as
            | "winner"
            | "firstRunnerUp"
            | "secondRunnerUp"
            | "participant",
        })
        .where(
          and(
            eq(teamHackathons.hackathonId, hackathonId),
            eq(teamHackathons.teamId, winners[pos.key])
          )
        )
        .execute();
    }
  }

  // set other teams as participants
  await db
    .update(teamHackathons)
    .set({ position: "participant" })
    .where(
      and(
        eq(teamHackathons.hackathonId, hackathonId),
        not(
          inArray(
            teamHackathons.teamId,
            [
              winners.winner,
              winners.firstRunnerUp,
              winners.secondRunnerUp,
            ].filter(Boolean)
          )
        )
      )
    )
    .execute();

  // Get all teamIds for this hackathon
  const allTeamIdArr = await db
    .select({ teamId: teamHackathons.teamId, captainId: teams.captainId })
    .from(teamHackathons)
    .innerJoin(teams, eq(teamHackathons.teamId, teams.id))
    .where(eq(teamHackathons.hackathonId, hackathonId));

  //  Get all members of those teams
  const allTeamIds = allTeamIdArr.map((t) => t.teamId);
  const captainIds = allTeamIdArr.map((t) => t.captainId);
  const allTeamMembers = await db
    .select({ userId: teamMembers.userId, teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(inArray(teamMembers.teamId, allTeamIds));

  //  Update each developer's participatedHackathonIds
  for (const member of allTeamMembers) {
    let position = "participant";
    if (member.teamId === winners.winner) position = "winner";
    else if (member.teamId === winners.firstRunnerUp)
      position = "firstRunnerUp";
    else if (member.teamId === winners.secondRunnerUp)
      position = "secondRunnerUp";

    const [existingDev] = await db
      .select({ participatedHackathonIds: developers.participatedHackathonIds })
      .from(developers)
      .where(eq(developers.userId, member.userId))
      .limit(1)
      .execute();

    const prevHackathons = Array.isArray(existingDev?.participatedHackathonIds)
      ? existingDev.participatedHackathonIds
      : [];

    const newHackathonObj = {
      hackathonId: hackathonId,
      position: position as
        | "winner"
        | "firstRunnerUp"
        | "secondRunnerUp"
        | "participant",
    };

    const updatedHackathons = [
      ...prevHackathons.filter((h: any) => h.hackathonId !== hackathonId),
      newHackathonObj,
    ];

    await db
      .update(developers)
      .set({ participatedHackathonIds: updatedHackathons })
      .where(eq(developers.userId, member.userId))
      .execute();
  }

  // Email to team captains about hackathon result announced
  const teamIdToPosition: Record<string, string> = {
    [winners.winner]: "winner",
    [winners.firstRunnerUp]: "firstRunnerUp",
    [winners.secondRunnerUp]: "secondRunnerUp",
  };
  allTeamIds.forEach((teamId) => {
    if (!teamIdToPosition[teamId]) teamIdToPosition[teamId] = "participant";
  });

  const captains = await db
    .select({
      email: users.email,
      name: users.firstName,
      teamId: teams.id,
      teamName: teams.name,
    })
    .from(users)
    .innerJoin(teams, eq(users.id, teams.captainId))
    .where(inArray(teams.id, allTeamIds))
    .execute();

  const organizer = await db
    .select({
      name: organizers.organizationName,
      email: organizers.companyEmail,
    })
    .from(organizers)
    .where(
      eq(
        organizers.userId,
        hackathon[0] && hackathon[0].createdBy ? hackathon[0].createdBy : ""
      )
    )
    .limit(1)
    .execute();

  for (const captain of captains) {
    const position = teamIdToPosition[captain.teamId] || "participant";
    // await sendHackathonResultEmail({
    //   email: captain.email,
    //   captainName: captain.name,
    //   teamName: captain.teamName,
    //   hackathonName: hackathon[0]?.title ?? "",
    //   organizationName: organizer[0]?.name ?? "",
    //   organizationEmail: organizer[0]?.email ?? "",
    //   position: position as
    //     | "participant"
    //     | "winner"
    //     | "firstRunnerUp"
    //     | "secondRunnerUp",
    // });

    //add to queue
    hackathonTeamEmailQueue.add("winner-result", {
      email: captain.email,
      captainName: captain.name,
      teamName: captain.teamName,
      hackathonName: hackathon[0]?.title ?? "",
      organizationName: organizer[0]?.name || "",
      organizationEmail: organizer[0]?.email || "",
      position: position as
        | "participant"
        | "winner"
        | "firstRunnerUp"
        | "secondRunnerUp",
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedHackathon, "Winners marked successfully")
    );
});

export {
  applyToHackathon,
  viewAllHackathons,
  viewHackathonById,
  createHackathon,
  embedHackathons,
  markWinners,
};

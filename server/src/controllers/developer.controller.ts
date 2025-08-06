import { and, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "../db";
import { developers } from "../db/schema/developer.schema";
import { ApiResponse } from "../utils/ApiResponse";
import { completeDeveloperProfileSchema } from "../zod-schema/developer.schema";
import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { users } from "../db/schema/user.schema";
import { hackathons } from "../db/schema/hackathon.schema";
import { userInteractions } from "../db/schema/userInteraction.schema";
import { llm } from "../lib/llm";
import { initialiseVectorStore } from "../lib/vectorStore";
import hackathonStatusChecker from "../utils/hackathonStatusChecker";
import { teams } from "../db/schema/team.schema";

// Controller to handle completing a developer's profile
const completeDeveloperProfile = asyncHandler(async (req, res) => {
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

    // Check if profile is complete
    const isProfileComplete =
      !!validatedData.title &&
      Array.isArray(validatedData.skills) &&
      validatedData.skills.length > 0 &&
      !!validatedData.location &&
      !!validatedData.location.city &&
      !!validatedData.location.country &&
      !!validatedData.location.state &&
      !!validatedData.location.address;

    // Update the developer profile
    const updatedProfile = await db
      .update(developers)
      .set({
        title: validatedData.title,
        bio: validatedData.bio,
        skills: validatedData.skills,
        socialLinks: validatedData.socialLinks,
        updatedAt: new Date(),
      })
      .where(eq(developers.userId, user.id))
      .returning();

    // Update user table's isProfileComplete
    await db
      .update(users)
      .set({
        isProfileComplete,
        location: {
          country: validatedData.location.country,
          state: validatedData.location.state,
          city: validatedData.location.city,
          address: validatedData.location.address ?? "",
        },
      })
      .where(eq(users.id, user.id));

    // Return the updated profile
    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedProfile[0], "Profile updated successfully ")
      );
  } catch (error: any) {
    console.error("Error updating developer profile:", error);

    throw new ApiError(500, "Something went wrong while updating the profile");
  }
});

// controller to fetch profile of a developer by ID
const fetchDeveloperProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Developer ID is required");
  }

  // Fetch the developer profile by ID
  const developerProfile = await db
    .select()
    .from(developers)
    .where(eq(developers.userId, id as string))
    .limit(1)
    .execute();

  if (developerProfile.length === 0 || !developerProfile[0]) {
    throw new ApiError(404, "Developer profile not found");
  }

  const user = await db
    .select({
      role: users.role,
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, developerProfile[0].userId))
    .limit(1)
    .execute();

  if (user.length === 0 || !user[0]) {
    throw new ApiError(404, "User not found");
  }

  // fetch the participated hackathons
  const participatedHackathonIds = Array.isArray(
    developerProfile[0]?.participatedHackathonIds
  )
    ? developerProfile[0].participatedHackathonIds
    : [];

  const participatedHackathonsCount = participatedHackathonIds.length;

  const winnerCount = participatedHackathonIds.filter(
    (item: any) => item.position === "winner"
  ).length;
  const firstRunnerUpCount = participatedHackathonIds.filter(
    (item: any) => item.position === "firstRunnerUp"
  ).length;
  const secondRunnerUpCount = participatedHackathonIds.filter(
    (item: any) => item.position === "secondRunnerUp"
  ).length;

  const hackathonsWithPositionCount =
    winnerCount + firstRunnerUpCount + secondRunnerUpCount;

  let hackathonDomainTags: any = [];
  if (participatedHackathonIds.length > 0) {
    const tagsResult = await db
      .select({ tags: hackathons.tags })
      .from(hackathons)
      .where(
        inArray(
          hackathons.id,
          participatedHackathonIds.map((h: any) => h.hackathonId)
        )
      )
      .execute();

    const allTags = tagsResult
      .map((row: any) => row.tags)
      .flat()
      .filter(Boolean);

    const distinctTags = Array.from(new Set(allTags));
    hackathonDomainTags = distinctTags;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...developerProfile[0],
        participatedHackathonsCount,
        hackathonsWithPositionCount,
        hackathonDomainTags,
        winnerCount,
        firstRunnerUpCount,
        secondRunnerUpCount,
        user: user[0],
      },
      "Profile fetched successfully"
    )
  );
});

// controller for handling notifications
const notificationHandling = asyncHandler(async (req, res) => {
  const { user } = req;
  const { id } = req.params;
  const { deleteOnlyNotification } = req.query;
  if (!user) {
    throw new ApiError(401, "User not authenticated");
  }

  // Fetch the developer's notifications in descending order
  const [dev] = await db
    .select({ notifications: developers.notifications })
    .from(developers)
    .where(eq(developers.userId, user.id))
    .limit(1)
    .execute();

  if (!dev) {
    throw new ApiError(404, "Developer not found");
  }

  let notifications = dev.notifications ?? [];

  notifications = notifications
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  if (notifications.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No notifications found"));
  }

  if (dev?.notifications?.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No notifications found"));
  }

  // find the notification by id and delete it
  const updatedNotifications = dev.notifications?.filter(
    (notification) => notification.id !== id
  );

  if (id && deleteOnlyNotification === "false") {
    // if the type of notification is "invitation-sent", remove the user id from the team's pending invitations
    if (
      dev.notifications?.find((notification) => notification.id === id)
        ?.type === "invitation-sent"
    ) {
      const notificationToDelete = dev.notifications?.find(
        (notification) => notification.id === id
      );

      if (!notificationToDelete) {
        throw new ApiError(404, "Notification not found");
      }

      const teamId = notificationToDelete?.teamId;

      if (!teamId) {
        throw new ApiError(400, "Team ID is required to remove invitation");
      }

      // Fetch the current pendingInvitesFromUsers array for the team
      const [team] = await db
        .select({ pendingInvitesFromUsers: teams.pendingInvitesFromUsers })
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1)
        .execute();

      if (!team) {
        throw new ApiError(404, "Team not found");
      }

      if (!team.pendingInvitesFromUsers) {
        throw new ApiError(400, "No pending invites found for this team");
      }

      const updatedPendingInvites = team.pendingInvitesFromUsers.filter(
        (inviteUserId: string) =>
          inviteUserId !== notificationToDelete.developerId
      );

      await db
        .update(teams)
        .set({
          pendingInvitesFromUsers: updatedPendingInvites,
        })
        .where(eq(teams.id, teamId))
        .execute();
    }

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

  if (id && deleteOnlyNotification === "true") {
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
    data: notifications,
    message: "Notifications fetched successfully",
  });
});

// Fetch all projects of the logged-in developer
const fetchProjects = asyncHandler(async (req, res) => {
  const { user } = req;
  if (!user) {
    throw new ApiError(401, "User not authenticated");
  }

  // Get developer profile
  const [developer] = await db
    .select({ projects: developers.projects })
    .from(developers)
    .where(eq(developers.userId, user.id))
    .limit(1)
    .execute();

  if (!developer) {
    throw new ApiError(404, "Developer profile not found");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        developer.projects || [],
        "Projects fetched successfully"
      )
    );
});

// Add a new project to the logged-in developer's profile
const addProject = asyncHandler(async (req, res) => {
  const { user, body } = req;
  if (!user) {
    throw new ApiError(401, "User not authenticated");
  }

  // Validate project fields
  const { title, description, techStack, repoUrl, demoUrl } = body;
  if (
    !title ||
    !techStack ||
    !Array.isArray(techStack) ||
    techStack.length === 0
  ) {
    throw new ApiError(400, "Project must have title and tech stack");
  }

  // Get current projects
  const [developer] = await db
    .select({ projects: developers.projects })
    .from(developers)
    .where(eq(developers.userId, user.id))
    .limit(1)
    .execute();

  if (!developer) {
    throw new ApiError(404, "Developer profile not found");
  }

  const newProject = {
    id: crypto.randomUUID(),
    title,
    description,
    techStack,
    repoUrl,
    demoUrl,
  };

  const updatedProjects = [...(developer.projects || []), newProject];

  // Update developer's projects
  await db
    .update(developers)
    .set({ projects: updatedProjects, updatedAt: new Date() })
    .where(eq(developers.userId, user.id))
    .execute();

  return res
    .status(201)
    .json(new ApiResponse(201, newProject, "Project added successfully"));
});

// controller to delete a project from the developer's profile
const deleteProject = asyncHandler(async (req, res) => {
  const { user } = req;
  const { projectId } = req.body;
  if (!user) {
    throw new ApiError(401, "User not authenticated");
  }
  if (!projectId) {
    throw new ApiError(400, "Project ID is required");
  }
  // Get current projects
  const [developer] = await db
    .select({ projects: developers.projects })
    .from(developers)
    .where(eq(developers.userId, user.id))
    .limit(1)
    .execute();
  if (!developer) {
    throw new ApiError(404, "Developer profile not found");
  }
  // Filter out the project to be deleted
  const updatedProjects = (developer.projects || []).filter(
    (project) => project.id !== projectId
  );
  // Update developer's projects
  await db
    .update(developers)
    .set({ projects: updatedProjects, updatedAt: new Date() })
    .where(eq(developers.userId, user.id))
    .execute();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Project deleted successfully"));
});

// controller for llm tag extraction
const getRecommendedHackathons = asyncHandler(async (req, res) => {
  const { user } = req;
  if (!user) {
    throw new ApiError(401, "User not authenticated");
  }
  const userId = user.id;

  const [recommendedHackathons] = await db
    .select({
      recommendedHackIds: developers.recommendedHackathonIds,
      skills: developers.skills,
    })
    .from(developers)
    .where(eq(developers.userId, userId))
    .execute();

  const recommendedHackObjects = Array.isArray(
    recommendedHackathons?.recommendedHackIds
  )
    ? recommendedHackathons.recommendedHackIds
    : [];

  const developerSkills = Array.isArray(recommendedHackathons?.skills)
    ? recommendedHackathons.skills.join(", ")
    : "";

  const start = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
  const end = new Date();

  const recentHackObjects = recommendedHackObjects.filter((obj) => {
    if (!obj.createdAt) return false;
    const createdAtDate = new Date(obj.createdAt);
    return createdAtDate >= start && createdAtDate <= end;
  });

  const recentHackIds = recentHackObjects.map((obj) => obj.hackathonId);

  let recommendedHackathonsData: any[] = [];

  if (recentHackIds.length > 0) {
    await db
      .update(developers)
      .set({ recommendedHackathonIds: recentHackObjects })
      .where(eq(developers.userId, userId))
      .execute();

    recommendedHackathonsData = await db
      .select()
      .from(hackathons)
      .where(inArray(hackathons.id, recentHackIds))
      .execute();

    if (recommendedHackathonsData.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No recommended hackathons found"));
    }

    //add status to the recommended hackathons
    const hackathonsWithStatus = recommendedHackathonsData.map((hack) => {
      const statusValue = hackathonStatusChecker(
        new Date(hack.registrationStart ?? ""),
        new Date(hack.registrationEnd ?? ""),
        new Date(hack.startTime ?? ""),
        new Date(hack.endTime ?? "")
      );
      return {
        ...hack,
        status: statusValue,
      };
    });

    const filteredHackathons = hackathonsWithStatus.filter((hack) =>
      ["upcoming", "Registration in Progress"].includes(hack.status)
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          filteredHackathons,
          "Recommended hackathons fetched successfully"
        )
      );
  }

  //fetch user interactions
  const fetchedUserInteractions = await db
    .select({
      id: userInteractions.id,
      registeredTags: userInteractions.hackathonsRegisteredTags,
      mode: userInteractions.preferredMode,
      createdAt: userInteractions.createdAt,
    })
    .from(userInteractions)
    .where(eq(userInteractions.userId, userId))
    .execute();

  if (fetchedUserInteractions.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No user interactions found"));
  }

  // fetch latest N interactions
  const latestNInteractions = [...fetchedUserInteractions]
    .sort((a: any, b: any) => b.createdAt - a.createdAt)
    .slice(0, 10);

  const latestIds = latestNInteractions.map((i) => i.id);

  if (latestNInteractions.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No user interactions found"));
  }

  // Update the user interactions in db with the latest N interactions
  await db
    .delete(userInteractions)
    .where(
      and(
        eq(userInteractions.userId, userId),
        notInArray(userInteractions.id, latestIds)
      )
    )
    .execute();

  const PROMPT = `User interactions summary:
Registered Tags: ${latestNInteractions
    .map((i) => (i.registeredTags || []).join(", "))
    .join("; ")}
Preferred Mode: ${latestNInteractions.map((i) => i.mode).join(", ")}
Developer Skills: ${developerSkills}

From the given context, return ONLY those hackathon IDs that are highly relevant to the user's registered tags and preferred mode and developer skills.
Do NOT include any hackathon that is not clearly relevant to the user's interests.
Respond strictly with a JSON array of hackathon IDs, and nothing else.
`;

  const vecStore = await initialiseVectorStore({
    collectionName: "hackathon-embeddings",
  });

  const vectorResults = await vecStore.similaritySearch(PROMPT, 5);

  if (vectorResults.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No relevant hackathons found"));
  }

  const response = await llm.invoke(`You are a hackathon recommendation system. 
Based on the user interactions and hackathon context provided, return ONLY the relevant hackathon IDs.

IMPORTANT: Return the hackathon IDs as a simple comma-separated string format like this:
id1,id2,id3

Context: ${vectorResults.map((doc: any) => doc.pageContent).join("\n")}

Return only comma-separated hackathon IDs that are relevant to the user interactions:`);

  // Extract hackathon IDs from the response
  const hackathonIds = response.text.split(",").map((id: string) => id.trim());

  if (!hackathonIds || hackathonIds.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No recommended hackathons found"));
  }

  const latestRecommendedHackathonObjects = hackathonIds.map((id) => ({
    hackathonId: id,
    createdAt: new Date(),
  }));

  // set recommended hackathon ids in developer profile
  const latestRecommendedHackathons = await db
    .update(developers)
    .set({ recommendedHackathonIds: latestRecommendedHackathonObjects })
    .where(eq(developers.userId, userId))
    .returning();

  if (latestRecommendedHackathons.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No recommended hackathons found"));
  }

  // Fetch the recommended hackathons from the database
  recommendedHackathonsData = await db
    .select()
    .from(hackathons)
    .where(inArray(hackathons.id, hackathonIds))
    .execute();

  if (recommendedHackathonsData.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No recommended hackathons found"));
  }

  // Add status to the recommended hackathons
  const hackathonsWithStatus = recommendedHackathonsData.map((hack) => {
    const statusValue = hackathonStatusChecker(
      new Date(hack.registrationStart ?? ""),
      new Date(hack.registrationEnd ?? ""),
      new Date(hack.startTime ?? ""),
      new Date(hack.endTime ?? "")
    );
    return {
      ...hack,
      status: statusValue,
    };
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        hackathonsWithStatus,
        "Recommended hackathons fetched successfully"
      )
    );
});

export {
  completeDeveloperProfile,
  fetchDeveloperProfile,
  notificationHandling,
  fetchProjects,
  addProject,
  getRecommendedHackathons,
  deleteProject,
};

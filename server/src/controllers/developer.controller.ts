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

  const participatedHackathons = await db
    .select({ tags: hackathons.tags })
    .from(hackathons)
    .where(
      participatedHackathonIds.length > 0
        ? inArray(
            hackathons.id,
            participatedHackathonIds.map((h: any) => h.hackathonId)
          )
        : undefined
    )
    .execute();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...developerProfile[0],
        participatedHackathonsCount,
        hackathonsWithPositionCount,
        participatedHackathons,
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

// controller for llm tag extraction
const getRecommendedHackathons = asyncHandler(async (req, res) => {
  const { user } = req;
  if (!user) {
    throw new ApiError(401, "User not authenticated");
  }
  const userId = user.id;

  const [recommendedHackathons] = await db
    .select({ recommendedHackIds: developers.recommendedHackathonIds })
    .from(developers)
    .where(eq(developers.userId, userId))
    .execute();

  const recommendedHackObjects = Array.isArray(
    recommendedHackathons?.recommendedHackIds
  )
    ? recommendedHackathons.recommendedHackIds
    : [];

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
    // add latest recommended hackathons to the developer's profile and remove the old ones
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
    console.log("Hackathons with status:", hackathonsWithStatus);
    //return only those which are upcoming or their registration is in progress
    const filteredHackathons = hackathonsWithStatus.filter((hack) =>
      ["upcoming", "Registration in Progress"].includes(hack.status)
    );

    console.log("Filtered Hackathons:", filteredHackathons);

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

  // fetch latest N interactions
  const latestNInteractions = [...fetchedUserInteractions]
    .sort((a: any, b: any) => b.createdAt - a.createdAt)
    .slice(0, 10);

  const latestIds = latestNInteractions.map((i) => i.id);

  // Update the user interactions in db with the latest N interactions
  await db
    .delete(userInteractions)
    .where(
      and(
        eq(userInteractions.userId, userId),
        // id not in latestIds
        notInArray(userInteractions.id, latestIds)
      )
    )
    .execute();

  const PROMPT = `User interactions summary:
Registered Tags: ${latestNInteractions
    .map((i) => (i.registeredTags || []).join(", "))
    .join("; ")}
Preferred Mode: ${latestNInteractions.map((i) => i.mode).join(", ")}

From the given context, return ONLY those hackathon IDs that are highly relevant to the user's registered tags and preferred mode.
Do NOT include any hackathon that is not clearly relevant to the user's interests.
Respond strictly with a JSON array of hackathon IDs, and nothing else.
`;

  const vecStore = await initialiseVectorStore({
    collectionName: "hackathon-embeddings",
  });

  const vectorResults = await vecStore.similaritySearch(PROMPT, 5);

  const response =
    await llm.invoke(`Return only the hackathon ids in the form of array which are comma separated. The ids can be lesser than the hackathons in the vector store. But return only those hackathons which are relevant to the user interactions.
Context: ${vectorResults.map((doc: any) => doc.pageContent).join("\n")}`);

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
};

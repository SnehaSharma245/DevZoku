import { eq } from "drizzle-orm";
import { db } from "../db";
import { developers } from "../db/schema/developer.schema";
import { ApiResponse } from "../utils/ApiResponse";
import { completeDeveloperProfileSchema } from "../zod-schema/developer.schema";
import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
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
          }, // location ab yahan store hogi
        })
        .where(eq(users.id, user.id));

      // Return the updated profile
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedProfile[0],
            "Profile updated successfully "
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

// controller to fetch profile of a developer by ID
const fetchDeveloperProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { user } = req;
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

    if (developerProfile.length === 0) {
      throw new ApiError(404, "Developer profile not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          developerProfile[0],
          "Profile fetched successfully"
        )
      );
  }
);

// controller for handling notifications
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

// Fetch all projects of the logged-in developer
const fetchProjects = asyncHandler(async (req: Request, res: Response) => {
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
const addProject = asyncHandler(async (req: Request, res: Response) => {
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

export {
  completeDeveloperProfile,
  fetchDeveloperProfile,
  notificationHandling,
  fetchProjects,
  addProject,
};

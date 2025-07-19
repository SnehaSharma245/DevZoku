import { eq, desc, and, inArray, sql, name } from "drizzle-orm";
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
import { hackathons, teamHackathons } from "../db/schema/hackathon.schema";
import { hackathonTeamEmailQueue } from "../queues/queue";
import formatDate from "../utils/formatDate";
import { organizers } from "../db/schema/organizer.schema";

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

      // Check if profile is complete
      const isProfileComplete =
        !!validatedData.title &&
        Array.isArray(validatedData.skills) &&
        validatedData.skills.length > 0 &&
        !!validatedData.location &&
        !!validatedData.location.city &&
        !!validatedData.location.country &&
        !!validatedData.location.state;

      // Update the developer profile
      const updatedProfile = await db
        .update(developers)
        .set({
          title: validatedData.title,
          bio: validatedData.bio,
          skills: validatedData.skills,
          socialLinks: validatedData.socialLinks,
          projects: validatedData.projects || [],
          location: validatedData.location,
          updatedAt: new Date(),
        })
        .where(eq(developers.userId, user.id))
        .returning();

      // Update user table's isProfileComplete
      await db
        .update(users)
        .set({ isProfileComplete })
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

export {
  completeDeveloperProfile,
  fetchDeveloperProfile,
  notificationHandling,
};

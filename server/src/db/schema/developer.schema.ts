import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  decimal,
  json,
} from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const developers = pgTable("developers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id), // Foreign key to users table
  // Profile Setup
  title: varchar("title", { length: 100 }),
  bio: text("bio"),

  // Resume & Skills,
  skills: text("skills").array(),

  // Social Links
  socialLinks: json("social_links").$type<{
    github?: string;
    linkedin?: string;
    portfolio?: string;
    twitter?: string;
    hashnode?: string;
    devto?: string;
    instagram?: string;
  }>(),

  projects: json("projects").$type<
    {
      title: string;
      description: string;
      techStack: string[]; // or string (comma-separated)
      repoUrl?: string;
      demoUrl?: string;
    }[]
  >(),

  // Scoring & Ranking
  overallScore: decimal("overall_score", { precision: 10, scale: 2 }).default(
    "0.00"
  ),

  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

  notifications: json("notifications")
    .$type<
      | {
          id: string;
          type: "invitation-sent" | "invitation-accepted";
          message: string;
          createdAt: string;
          teamId?: string; // Optional, only for invite notifications
        }[]
      | null
    >()
    .default(null),
});

export type Developer = typeof developers.$inferSelect;
export type NewDeveloper = typeof developers.$inferInsert;

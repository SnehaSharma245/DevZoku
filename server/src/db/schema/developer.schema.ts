import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  decimal,
  json,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const developers = pgTable("developers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  title: varchar("title", { length: 100 }),
  bio: text("bio"),
  skills: text("skills").array(),
  socialLinks: json("social_links").$type<{
    github?: string;
    linkedin?: string;
    portfolio?: string;
    twitter?: string;
    hashnode?: string;
    devto?: string;
  }>(),
  projects: json("projects").$type<
    {
      id: string;
      title: string;
      description: string;
      techStack: string[];
      repoUrl?: string;
      demoUrl?: string;
    }[]
  >(),
  overallScore: decimal("overall_score", { precision: 10, scale: 2 }).default(
    "0.00"
  ),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  notifications: json("notifications")
    .$type<
      | {
          id: string;
          type: "invitation-sent" | "invitation-accepted";
          message: string;
          createdAt: string;
          teamId?: string;
          hackathonId?: string;
          developerId?: string;
        }[]
      | null
    >()
    .default(null),
  recommendedHackathonIds: jsonb("recommended-hack-ids"),
  participatedHackathonIds: jsonb("participated-hack-ids"),
});

export type Developer = typeof developers.$inferSelect;
export type NewDeveloper = typeof developers.$inferInsert;

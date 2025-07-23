import {
  pgTable,
  varchar,
  text,
  timestamp,
  uuid,
  boolean,
  json,
} from "drizzle-orm/pg-core";
import { hackathons, modeSchemaEnum } from "./hackathon.schema";
import { users } from "./user.schema";

const interactionTypeEnum = ["view", "search", "register"] as const;

export const userInteractions = pgTable("user_interactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  hackathonTagsSearchedFor: varchar("hackathon_tags_searched_for").array(),
  hackathonsRegisteredTags: varchar("hackathons_registered_tags").array(),
  preferredDuration: varchar("preferred_duration", {
    length: 50,
  }),
  preferredMode: varchar("preferred_mode", {
    length: 50,
    enum: modeSchemaEnum,
  }),
  interactionType: varchar("interaction_type", {
    length: 20,
    enum: interactionTypeEnum,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userHackathonViews = pgTable("user_hackathon_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  hackathonId: uuid("hackathon_id").notNull(),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

export type UserHackathonViews = typeof userHackathonViews.$inferSelect;
export type NewUserHackathonView = typeof userHackathonViews.$inferInsert;

export type UserInteraction = typeof userInteractions.$inferSelect;
export type NewUserInteraction = typeof userInteractions.$inferInsert;

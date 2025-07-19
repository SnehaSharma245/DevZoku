import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  json,
} from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const organizers = pgTable("organizers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id), // Foreign key to users table

  // Organization Info
  organizationName: varchar("organization_name", { length: 150 }),

  // Contact & Description
  bio: text("bio"),
  website: varchar("website", { length: 255 }),
  companyEmail: varchar("company_email", { length: 100 }),
  phoneNumber: varchar("phone_number", { length: 20 }),

  // 🌐 Social Links (JSON)
  socialLinks: json("social_links").$type<{
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  }>(),

  // Statistics
  totalEventsOrganized: integer("total_events_organized").default(0),

  // Profile Status
  isProfileComplete: boolean("is_profile_complete").default(false),
  isVerified: boolean("is_verified").default(false),

  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Organizer = typeof organizers.$inferSelect;
export type NewOrganizer = typeof organizers.$inferInsert;

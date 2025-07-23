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
    .references(() => users.id),
  organizationName: varchar("organization_name", { length: 150 }),
  bio: text("bio"),
  website: varchar("website", { length: 255 }),
  companyEmail: varchar("company_email", { length: 100 }),
  socialLinks: json("social_links").$type<{
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  }>(),
  totalEventsOrganized: integer("total_events_organized").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  phoneNumber: varchar("phone_number", { length: 15 }).default(""),
});

export type Organizer = typeof organizers.$inferSelect;
export type NewOrganizer = typeof organizers.$inferInsert;

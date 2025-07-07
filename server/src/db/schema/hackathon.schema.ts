import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  primaryKey,
  index,
  boolean,
} from "drizzle-orm/pg-core";

import { teams } from "./team.schema";
import { users } from "./user.schema";

const statusSchemaEnum = ["upcoming", "ongoing", "completed"] as const;

//HACKATHONS table with indexes
export const hackathons = pgTable(
  "hackathons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull().unique(),
    description: varchar("description", { length: 1000 }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at").defaultNow(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    status: varchar("status", {
      length: 20,
      enum: statusSchemaEnum,
    }),
  },
  (t) => [
    index("idx_status").on(t.status),
    index("idx_created_by").on(t.createdBy),
    index("idx_start_time").on(t.startTime),
    index("idx_end_time").on(t.endTime),
  ]
);

//TEAM_HACKATHONS table with indexes
export const teamHackathons = pgTable(
  "team_hackathons",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    hackathonId: uuid("hackathon_id")
      .notNull()
      .references(() => hackathons.id, { onDelete: "cascade" }),
    submittedAt: timestamp("submitted_at").defaultNow(),
    score: integer("score").default(0),
    isWinner: boolean("is_winner").default(false),
  },
  (t) => [
    primaryKey({ columns: [t.teamId, t.hackathonId] }),
    index("idx_team_id").on(t.teamId),
    index("idx_hackathon_id").on(t.hackathonId),
    index("idx_score").on(t.score),
    index("idx_is_winner").on(t.isWinner),
  ]
);

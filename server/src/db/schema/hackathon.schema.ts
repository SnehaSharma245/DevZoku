import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  primaryKey,
  index,
  boolean,
  json,
} from "drizzle-orm/pg-core";

import { teams } from "./team.schema";
import { users } from "./user.schema";

const modeSchemaEnum = ["online", "offline"] as const;

//HACKATHONS table with indexes
export const hackathons = pgTable(
  "hackathons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull().unique(),
    description: varchar("description", { length: 1000 }),
    registrationStart: timestamp("registration_start", { withTimezone: true }),
    registrationEnd: timestamp("registration_end", { withTimezone: true }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }),
    tags: varchar("tags", { length: 100 }).array().$type<string[]>(),
    poster: varchar("poster", { length: 500 }),
    minTeamSize: integer("min_team_size").notNull(),
    maxTeamSize: integer("max_team_size").notNull(),
    mode: varchar("mode", { length: 20, enum: modeSchemaEnum }).notNull(),
    positionHolders: json("position_holders").$type<{
      1: { teamId: string };
      2: { teamId: string };
      3: { teamId: string };
    }>(),
  },
  (t) => [
    index("idx_hackathons_created_by").on(t.createdBy),
    index("idx_hackathons_start_time").on(t.startTime),
    index("idx_hackathons_end_time").on(t.endTime),
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
    isWinner: boolean("is_winner").default(false),
  },
  (t) => [
    primaryKey({ columns: [t.teamId, t.hackathonId] }),
    index("idx_team_hackathons_team_id").on(t.teamId),
    index("idx_team_hackathons_hackathon_id").on(t.hackathonId),
    index("idx_team_hackathons_is_winner").on(t.isWinner),
  ]
);

export const hackathonPhases = pgTable(
  "hackathon_phases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hackathonId: uuid("hackathon_id")
      .notNull()
      .references(() => hackathons.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    description: varchar("description", { length: 1000 }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    order: integer("order").notNull(),
  },
  (t) => [
    index("idx_hackathon_phases_hackathon_id").on(t.hackathonId),
    index("idx_hackathon_phases_order").on(t.order),
    index("idx_hackathon_phases_start_time").on(t.startTime),
    index("idx_hackathon_phases_end_time").on(t.endTime),
  ]
);

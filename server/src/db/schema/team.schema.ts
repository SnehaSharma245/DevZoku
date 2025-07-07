import {
  pgTable,
  boolean,
  uuid,
  varchar,
  timestamp,
  primaryKey,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./user.schema";

// Teams Table with Indexes
export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    description: varchar("description", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow(),

    captainId: uuid("captain_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),

    teamSize: integer("team_size").default(1),
    isAcceptingInvites: boolean("is_accepting_invites").default(true),
    skillsNeeded: varchar("skills_needed", { length: 500 }),
  },
  (t) => [
    index("idx_teams_accepting_invites").on(t.isAcceptingInvites),
    index("idx_teams_skills_needed").on(t.skillsNeeded),
    index("idx_teams_captain_id").on(t.captainId),
    index("idx_teams_created_by").on(t.createdBy),
    index("idx_teams_created_at").on(t.createdAt),
  ]
);

//  TeamMembers Table with Indexes
export const teamMembers = pgTable(
  "team_members",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.teamId, t.userId] }),
    index("idx_team_members_team_id").on(t.teamId),
    index("idx_team_members_user_id").on(t.userId),
  ]
);

import { relations } from "drizzle-orm";
import { users } from "./user.schema";
import { teams } from "./team.schema";
import { teamMembers } from "./team.schema";
import { hackathons } from "./hackathon.schema";
import { teamHackathons } from "./hackathon.schema";

// ✅ Team ↔ TeamMembers
export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
  hackathons: many(teamHackathons),
}));

// ✅ Users ↔ TeamMembers
export const usersRelations = relations(users, ({ many }) => ({
  teams: many(teamMembers),
}));

// ✅ TeamMembers ↔ both sides
export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

// ✅ Hackathons ↔ TeamHackathons
export const hackathonRelations = relations(hackathons, ({ many }) => ({
  participants: many(teamHackathons),
}));

// ✅ TeamHackathons ↔ both sides
export const teamHackathonsRelations = relations(teamHackathons, ({ one }) => ({
  team: one(teams, {
    fields: [teamHackathons.teamId],
    references: [teams.id],
  }),
  hackathon: one(hackathons, {
    fields: [teamHackathons.hackathonId],
    references: [hackathons.id],
  }),
}));

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

// Organizer Hackathon History
export const organizerHackathonHistory = pgTable(
  "organizer_hackathon_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hackathonId: uuid("hackathon_id"),
    title: varchar("title", { length: 255 }),
    dateCompleted: timestamp("date_completed"),
    organizerId: uuid("organizer_id"),
  }
);

// Team Hackathon History
export const teamHackathonHistory = pgTable("team_hackathon_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  hackathonId: uuid("hackathon_id"),
  teamId: uuid("team_id"),
  score: integer("score"),
  isWinner: boolean("is_winner"),
  rank: integer("rank"),
  dateCompleted: timestamp("date_completed"),
});

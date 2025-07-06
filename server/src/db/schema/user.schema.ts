import {
  pgTable,
  varchar,
  text,
  timestamp,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { length: 20 }).notNull().default("developer"), // 'developer' or 'organizer'
  password: text("password").notNull().default(""),
  refreshToken: text("refresh_token").default(""),
  googleId: varchar("google_id", { length: 100 }).unique().default(""),
  isProfileComplete: boolean("is_profile_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

import {
  pgTable,
  varchar,
  text,
  timestamp,
  uuid,
  boolean,
  json,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { length: 20 }).notNull().default("developer"),
  password: text("password").notNull().default(""),
  refreshToken: text("refresh_token").default(""),
  googleId: varchar("google_id", { length: 100 }).unique().default(""),
  isProfileComplete: boolean("is_profile_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  location: json("location").$type<{
    country: string;
    state: string;
    city: string;
    address: string;
  }>(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

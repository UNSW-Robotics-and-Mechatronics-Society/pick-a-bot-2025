import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().default("").unique(),
  tokens: integer("tokens").notNull().default(100),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

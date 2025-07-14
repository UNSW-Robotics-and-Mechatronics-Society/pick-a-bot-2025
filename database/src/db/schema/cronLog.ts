import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const cronLog = pgTable("cron_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  runAt: timestamp("run_at", { withTimezone: true }).notNull(),
  payload: text("payload"),
  by: text("by").default("cron").notNull(),
  status: text("status").default("SUCCESS").notNull(),
});

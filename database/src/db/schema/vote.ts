import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { match } from "./match";
import { user } from "./user";

export const vote = pgTable("vote", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }),
  matchId: uuid("match_id").references(() => match.id, { onDelete: "cascade" }),
  botChosen: text("bot_chosen").notNull(),
  usedTokens: integer("used_tokens").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { match } from "./match";
import { user } from "./user";

export const vote = pgTable(
  "vote",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    matchId: uuid("match_id")
      .notNull()
      .references(() => match.id, { onDelete: "cascade" }),
    botChosen: text("bot_chosen").notNull(),
    usedTokens: integer("used_tokens").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // one vote per user per match
    uniqueIndex("unique_user_match").on(table.userId, table.matchId),
  ]
);

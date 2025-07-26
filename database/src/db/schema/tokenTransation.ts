import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { match } from "./match";
import { user } from "./user";
import { vote } from "./vote";

export const tokenTransaction = pgTable("token_transaction", {
  id: uuid("id").defaultRandom().primaryKey(),
  voteId: uuid("vote_id")
    .notNull()
    .references(() => vote.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  matchId: uuid("match_id").references(() => match.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  balanceBefore: integer("balance_before").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

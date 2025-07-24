import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { match } from "./match";
import { user } from "./user";

export const tokenTransaction = pgTable("token_transaction", {
  id: uuid("id").defaultRandom().primaryKey(),
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

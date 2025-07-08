import {
  boolean,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { matchStateEnum } from "./enums";

export const match = pgTable("match", {
  id: uuid("id").defaultRandom().primaryKey(),
  challongeMatchId: integer("challonge_match_id").notNull(),
  bot1: text("bot1").notNull(),
  bot2: text("bot2").notNull(),
  winner: text("winner"),
  scoreBot1: smallint("score_bot1").default(0),
  scoreBot2: smallint("score_bot2").default(0),
  round: integer("round").notNull(),
  state: matchStateEnum("state").notNull().default("pending"),
  startTime: timestamp("start_time", { withTimezone: true }),
  ordering: integer("ordering").notNull().unique(),
  tournamentId: text("tournament_id").notNull(),
  updatedTime: timestamp("updated_time", { withTimezone: true }).defaultNow(),
  isFinal: boolean("is_final").default(false).notNull(),
});

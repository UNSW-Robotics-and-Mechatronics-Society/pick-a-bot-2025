import { pgEnum } from "drizzle-orm/pg-core";

export const matchStateEnum = pgEnum("match_state", [
  "pending",
  "open",
  "complete",
]);

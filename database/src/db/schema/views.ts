import { sql } from "drizzle-orm";
import { pgView } from "drizzle-orm/pg-core";
import { user } from "./user";

export const leaderboard = pgView("leaderboard").as((qb) =>
  qb
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      tokens: user.tokens,
      rank: sql`DENSE_RANK() OVER (ORDER BY ${user.tokens} DESC)`.as("rank"),
    })
    .from(user)
    .orderBy(sql`rank ASC, ${user.name} ASC`)
);

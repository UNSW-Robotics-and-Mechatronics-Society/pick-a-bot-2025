import { pgView } from "drizzle-orm/pg-core";
import { user } from "./user";

export const leaderboard = pgView("leaderboard").as((qb) =>
  qb
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      tokens: user.tokens,
    })
    .from(user)
);

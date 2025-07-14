import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { match } from "./db/schema";

const connectionString = process.env.DATABASE_URL!;

const isLocal =
  connectionString.includes("127.0.0.1") ||
  connectionString.includes("localhost");

const client = postgres(connectionString, {
  prepare: false,
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});

const db = drizzle(client);

async function main() {
  const allMatches = await db.select().from(match);
  console.log(allMatches);
}

main();

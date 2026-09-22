import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://nex:nex@localhost:5432/nex";

const client = postgres(connectionString, { max: 1 });

export const db = drizzle(client, { schema });

export async function checkDb(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

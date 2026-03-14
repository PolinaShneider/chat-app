import postgres from "postgres";
import { getEnv } from "@/server/env";

type SqlClient = ReturnType<typeof postgres>;

let sqlClient: SqlClient | null = null;

export function getSql(): SqlClient {
  if (sqlClient) return sqlClient;

  const env = getEnv();

  sqlClient = postgres(env.DATABASE_URL, {
    ssl: "require",
    max: 1,
  });

  return sqlClient;
}


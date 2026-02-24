import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

/**
 * postgres.js client for query execution.
 * Using max 10 connections for the connection pool.
 */
const client = postgres(connectionString, { max: 10 });

/**
 * Drizzle ORM instance with full schema (tables + relations).
 * Import this wherever you need database access.
 */
export const db = drizzle(client, { schema });

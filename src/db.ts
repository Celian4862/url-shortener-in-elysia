// src/db.ts
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

// This will automatically create a local "sqlite.db" file in your project root
const sqlite = new Database("sqlite.db");

export const db = drizzle({ client: sqlite });

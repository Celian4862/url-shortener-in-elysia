// src/db.ts
// import { Database } from "bun:sqlite"; // Commented in case it is needed for local testing
import { createClient } from "@libsql/client";
// import { drizzle as drizzleBun } from "drizzle-orm/bun-sqlite"; // Commented in case it is needed for local testing
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";

export const tursoUrl = (() => {
	const tursoUrl = process.env.TURSO_DATABASE_URL;

	if (!tursoUrl) {
		throw new Error(
			"❌ TURSO_DATABASE_URL is missing from your environment variables. Please check your .env file or Vercel dashboard.",
		);
	}
	return tursoUrl;
})();

export const db = drizzleLibsql({
	client: createClient({
		url: tursoUrl,
		authToken: process.env.TURSO_AUTH_TOKEN,
	}),
});
// export const db = drizzleBun({ client: new Database("sqlite.db") }); // Commented in case it is needed for local testing

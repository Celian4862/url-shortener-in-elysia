// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import { tursoUrl } from "./src/db";

export default defineConfig({
	schema: "./src/schema.ts",
	out: "./drizzle",
	// dialect: "sqlite",
	dialect: "turso",
	dbCredentials: {
		// url: "sqlite.db",
		url: tursoUrl,
		authToken: process.env.TURSO_AUTH_TOKEN,
	},
});

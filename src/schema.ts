// src/schema.ts
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const shortUrls = sqliteTable("short_urls", {
	id: text("id").primaryKey(),
	longUrl: text("long_url").notNull(),
});

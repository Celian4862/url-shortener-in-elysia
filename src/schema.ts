import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const shortUrls = sqliteTable("short_urls", {
	id: text("id").primaryKey(),
	longUrl: text("long_url").notNull(),
	hits: int("hits").notNull().default(0),
});

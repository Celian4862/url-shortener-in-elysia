import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "./db";
import { shortUrls } from "./schema";

const base62Alphabet =
	"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const nanoid = async () => {
	const { customAlphabet } = await import("nanoid");
	return customAlphabet(base62Alphabet, 8)();
};

export const app = new Elysia()
	.get(
		"/",
		() =>
			'Usage: POST method with "longUrl" in body field, or GET method with short URL ID as a GET param',
	)
	.post(
		"/",
		async ({ body: { longUrl }, set }) => {
			try {
				const newShortUrl = await db
					.insert(shortUrls)
					.values({ id: await nanoid(), longUrl })
					.returning();
				set.status = 201;
				return newShortUrl[0];
			} catch (_) {
				set.status = 400;
				return { error: "Short URL already exists or invalid data" };
			}
		},
		{
			body: t.Object({
				longUrl: t.String({
					format: "url",
					minLength: 1,
					maxLength: 2048,
				}),
			}),
		},
	)
	.get(
		"/:id",
		async ({ params: { id }, set, redirect }) => {
			const longUrl = await db
				.select({ longUrl: shortUrls.longUrl, hits: shortUrls.hits })
				.from(shortUrls)
				.where(eq(shortUrls.id, id));
			if (longUrl.length === 0) {
				set.status = 404;
				return { error: "Invalid short URL" };
			}
			await db
				.update(shortUrls)
				.set({ hits: longUrl[0].hits + 1 })
				.where(eq(shortUrls.id, id));
			return redirect(longUrl[0].longUrl, 301);
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	.listen(3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
// Use SQLite for DB and marking how often a URL was hit
// Adding indexing for the column that has the short URL
// Don't forget to add rate limiting for the API
// Always check if the short URL already exists in the DB before trying to save

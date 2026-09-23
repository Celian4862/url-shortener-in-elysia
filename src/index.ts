import { openapi } from "@elysia/openapi";
import { eq, lt, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { Redis } from "ioredis";
import { customAlphabet } from "nanoid";
import { db } from "./db";
import { shortUrls } from "./schema";

const base62Alphabet =
	"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const nanoid = () => {
	return customAlphabet(base62Alphabet, 8)();
};

const redis = new Redis(
	(() => {
		const redisUrl = process.env.REDIS_URL;

		if (!redisUrl) {
			throw new Error(
				"❌ REDIS_URL or KV_URL is missing from your environment variables. Please check your Vercel integration settings.",
			);
		}
		return redisUrl;
	})(),
); // Probably port 6379

// For cleaning up old short URLs
const threeWeeksAgo = () => Math.floor(Date.now() / 1000) - 1814400; // 21 days/week * 24 hrs/day * 60 mins/hr * 60 secs/min

const app = new Elysia()
	.use(openapi())
	.onAfterResponse(async () => {
		try {
			// Delete any old short URLs whenever a client sends a request to the server
			await db
				.delete(shortUrls)
				.where(lt(shortUrls.createdAt, threeWeeksAgo()));
		} catch (err) {
			console.error("Non-blocking cleanup failed:", err);
		}
	})
	.onBeforeHandle(async ({ request, set }) => {
		try {
			const clientIp = request.headers.get("x-forwarded-for") ?? "local";
			const windowKey = Math.floor(Date.now() / 60_000); // changes every minute
			const redisKey = `ratelimit:${clientIp}:${windowKey}`;

			// Increment count and set a 60-second expiration atomically
			const requests = await redis.incr(redisKey);
			if (requests === 1) {
				await redis.expire(redisKey, 60);
			} else if (requests > 10) {
				set.status = 429;
				return { error: "Too many requests, please try again later." };
			}
		} catch (err) {
			console.error("Redis rate-limiter failed, failing open:", err);
			// If Redis is down, we allow the request to proceed instead of crashing
		}
	})
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

				await redis.set(`url:${newShortUrl[0].id}`, longUrl);

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
			try {
				let targetUrl: string | null = null;

				const cachedUrl = await redis.get(`url:${id}`);

				if (cachedUrl) {
					targetUrl = cachedUrl;
				} else {
					const longUrl = await db
						.select({ longUrl: shortUrls.longUrl, hits: shortUrls.hits })
						.from(shortUrls)
						.where(eq(shortUrls.id, id));
					if (longUrl.length === 0) {
						set.status = 404;
						return { error: "Invalid short URL" };
					}
					targetUrl = longUrl[0].longUrl;

					await redis.set(`url:${id}`, targetUrl);
				}
				db.update(shortUrls)
					.set({ hits: sql`hits + 1` })
					.where(eq(shortUrls.id, id))
					.catch((err) => console.error("Failed to update hit count:", err));
				return redirect(targetUrl, 301);
			} catch (err) {
				console.error("Error resolving short URL:", err);
				set.status = 500;
				return { error: "Internal server error" };
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	.get("/cron/cleanup", async ({ headers, set }) => {
		if (headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		return {
			success: true,
			deleted:
				(
					await db
						.delete(shortUrls)
						.where(lt(shortUrls.createdAt, threeWeeksAgo()))
				).rowsAffected ?? 0,
		};
	});

if (import.meta.main) {
	app.listen(3000);

	console.log(
		`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
	);
}

export default app;

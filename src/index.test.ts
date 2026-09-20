import { beforeAll, describe, expect, it } from "bun:test";
import { app } from "./index";

const domain = "http://localhost/";
const sampleLongUrl = "http://neverssl.com/";

function postJson(path: string, longUrl: string) {
	return app.handle(
		new Request(`${domain}${path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				longUrl: longUrl,
			}),
		}),
	);
}

describe("Elysia", () => {
	it("is running", async () => {
		expect(
			await app.handle(new Request(domain)).then((res) => res.text()),
		).not.toBeNull();
	});
});

describe("GET root", () => {
	it("returns a message", async () => {
		const response = await app
			.handle(new Request(domain))
			.then((res) => res.text());
		expect(response).toBe(
			'Usage: POST method with "longUrl" in body field, or GET method with short URL ID as a GET param',
		);
	});
});

describe("POST long URL to shorten & subsequent GET short URL", () => {
	let longUrl: string;
	let shortUrl: string;

	beforeAll(async () => {
		const response = await postJson("", sampleLongUrl);
		expect(response.status).toBe(201);

		const data = (await response.json()) as {
			longUrl: string;
			id: string;
			hits: number;
		};
		shortUrl = data.id;
		longUrl = data.longUrl;
		expect(shortUrl).not.toBeFalsy();
		expect(longUrl).not.toBeFalsy();
	});

	describe("POST long URL to shorten (Validation Tests)", () => {
		it.each([
			["empty long URL", ""],
			["invalid domain", "not-a-real-url"],
			["input that is too long", sampleLongUrl.repeat(3000)],
		])("detects %s", async (_, invalidUrl) => {
			const response = await postJson("", invalidUrl);
			expect(response.status).toBe(422);
		});
	});

	describe("GET short URL", () => {
		it("redirects to the long URL", async () => {
			const response = await app.handle(new Request(`${domain}${shortUrl}`));
			expect(response.status).toBe(301);
			expect(response.headers.get("Location")).toBe(longUrl);
		});
		it("returns an error (invalid short URL)", async () => {
			expect(
				await app
					.handle(new Request(`${domain}pretty-sure-this-is-invalid`))
					.then((res) => res.json()),
			).toEqual({ error: "Invalid short URL" });
		});
	});
});

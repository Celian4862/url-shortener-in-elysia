import { describe, expect, it } from "bun:test";
import { app } from "./index";

const domain = "http://localhost/";

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

describe("POST longUrl to shorten", () => {
	it("returns a short URL", async () => {
		const response = await app
			.handle(
				new Request(domain, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						longUrl: "http://neverssl.com/",
					}),
				}),
			)
			.then((res) => res.json());
		expect(response).not.toBeNull();
	});
	describe("give invalid input", () => {
		it("detects empty long URL", async () => {
			const response = await app.handle(
				new Request(domain, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						longUrl: "",
					}),
				}),
			);
			expect(response.status).toBe(400);
		});
		it("detects invalid domain", async () => {
			const response = await app.handle(
				new Request(domain, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						longUrl: "not-a-real-url",
					}),
				}),
			);
			expect(response.status).toBe(400);
		});
	});
});

describe("GET short URL", () => {
	it("redirects to the long URL", async () => {
		expect(
			await app.handle(new Request(`${domain}`)).then((res) => res.text()),
		);
	});
	it("returns an error (invalid short URL)", async () => {
		expect(
			await app
				.handle(new Request(`${domain}pretty-sure-this-is-invalid`))
				.then((res) => res.json()),
		).toEqual({ error: "Invalid short URL" });
	});
});

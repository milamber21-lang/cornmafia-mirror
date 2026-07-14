//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/server/rate-limit.test.ts                                                            //
//// Language: TS                                                                                                //
//// Verifies shared DB-backed limiting, opaque identities, retry responses, and fail-closed behavior.          //
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/data/pg", () => ({
	query: queryMock,
}));

import { checkRateLimit } from "@/lib/server/rate-limit";

beforeEach(() => {
	queryMock.mockReset();
	delete process.env.CM_TRUST_PROXY_HEADERS;
});

afterEach(() => {
	delete process.env.CM_TRUST_PROXY_HEADERS;
});

describe("shared rate limiter", () => {
	it("allows requests through the guarded DB function using an opaque identity hash", async () => {
		queryMock.mockResolvedValue({
			rows: [{ allowed_flag: true, retry_after_seconds: 0 }],
		});

		const response = await checkRateLimit({
			request: new Request("https://example.test/api/me/media"),
			bucket: "member:media:upload",
			identity: "123456789",
			limit: 12,
			windowMs: 60_000,
		});

		expect(response).toBeNull();
		expect(queryMock).toHaveBeenCalledTimes(1);
		const params = queryMock.mock.calls[0]?.[1] as unknown[];
		expect(params[0]).toBe("member:media:upload");
		expect(params[1]).toMatch(/^[0-9a-f]{64}$/);
		expect(params[1]).not.toContain("123456789");
		expect(params[2]).toBe(12);
		expect(params[3]).toBe(60_000);
	});

	it("returns a retry response when the shared bucket is exhausted", async () => {
		queryMock.mockResolvedValue({
			rows: [{ allowed_flag: false, retry_after_seconds: "17" }],
		});

		const response = await checkRateLimit({
			request: new Request("https://example.test/api/revalidate-tag"),
			bucket: "revalidate-tag",
			limit: 30,
			windowMs: 60_000,
		});

		expect(response?.status).toBe(429);
		expect(response?.headers.get("Retry-After")).toBe("17");
		expect(await response?.json()).toMatchObject({
			ok: false,
			code: "RATE_LIMITED",
		});
	});

	it("does not trust client forwarding headers unless explicitly enabled", async () => {
		queryMock.mockResolvedValue({
			rows: [{ allowed_flag: true, retry_after_seconds: 0 }],
		});
		const request = new Request("https://example.test/api/revalidate-tag", {
			headers: { "x-forwarded-for": "203.0.113.42" },
		});

		await checkRateLimit({
			request,
			bucket: "revalidate-tag",
			limit: 30,
			windowMs: 60_000,
		});
		const untrustedHash = queryMock.mock.calls[0]?.[1]?.[1];

		process.env.CM_TRUST_PROXY_HEADERS = "true";
		await checkRateLimit({
			request,
			bucket: "revalidate-tag",
			limit: 30,
			windowMs: 60_000,
		});
		const trustedHash = queryMock.mock.calls[1]?.[1]?.[1];

		expect(untrustedHash).not.toBe(trustedHash);
	});

	it("fails closed when the shared limiter is unavailable", async () => {
		queryMock.mockRejectedValue(new Error("database unavailable"));
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

		const response = await checkRateLimit({
			request: new Request("https://example.test/api/me/content/create"),
			bucket: "member:content:create",
			identity: "123456789",
			limit: 30,
			windowMs: 60_000,
		});

		expect(response?.status).toBe(503);
		expect(response?.headers.get("Retry-After")).toBe("30");
		expect(await response?.json()).toMatchObject({
			ok: false,
			code: "RATE_LIMIT_UNAVAILABLE",
		});
		consoleError.mockRestore();
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

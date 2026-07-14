//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/server/mutation-origin.test.ts                                                       ////
//// Language: TS                                                                                                ////
//// Verifies central same-origin mutation protection and its narrow endpoint exemptions.                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { afterEach, describe, expect, it, vi } from "vitest";

import {
	assertSameOriginMutation,
	isMutationMethod,
} from "@/lib/server/mutation-origin";

type ErrorPayload = {
	ok: boolean;
	code: string;
	message: string;
};

function request(
	path: string,
	options: {
		method?: string;
		headers?: HeadersInit;
	} = {},
): Request {
	return new Request(`https://cornmafia.example${path}`, {
		method: options.method ?? "POST",
		headers: options.headers,
	});
}

async function readError(response: Response): Promise<ErrorPayload> {
	return (await response.json()) as ErrorPayload;
}

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("isMutationMethod", () => {
	it.each(["POST", "PUT", "PATCH", "DELETE", " post "])(
		"recognizes %s as a mutation",
		(method) => {
			expect(isMutationMethod(method)).toBe(true);
		},
	);

	it.each(["GET", "HEAD", "OPTIONS", ""])(
		"does not classify %s as a mutation",
		(method) => {
			expect(isMutationMethod(method)).toBe(false);
		},
	);
});

describe("assertSameOriginMutation", () => {
	it("allows non-mutation requests without origin proof", () => {
		expect(
			assertSameOriginMutation(request("/api/example", { method: "GET" })),
		).toBeNull();
	});

	it("allows same-origin Origin headers", () => {
		expect(
			assertSameOriginMutation(
				request("/api/example", {
					headers: { origin: "https://cornmafia.example" },
				}),
			),
		).toBeNull();
	});

	it("allows configured deployment origins", () => {
		vi.stubEnv("WEB_PUBLIC_URL", "https://www.cornmafia.example");

		expect(
			assertSameOriginMutation(
				request("/api/example", {
					headers: { origin: "https://www.cornmafia.example" },
				}),
			),
		).toBeNull();
	});

	it("allows same-origin referrers when Origin is absent", () => {
		expect(
			assertSameOriginMutation(
				request("/api/example", {
					headers: {
						referer: "https://cornmafia.example/me/content",
					},
				}),
			),
		).toBeNull();
	});

	it("allows explicit same-origin fetch metadata", () => {
		expect(
			assertSameOriginMutation(
				request("/api/example", {
					headers: { "sec-fetch-site": "same-origin" },
				}),
			),
		).toBeNull();
	});

	it("rejects explicit cross-site requests before route logic", async () => {
		const response = assertSameOriginMutation(
			request("/api/example", {
				headers: {
					origin: "https://attacker.example",
					"sec-fetch-site": "cross-site",
				},
			}),
		);

		expect(response?.status).toBe(403);
		expect(response ? await readError(response) : null).toEqual({
			ok: false,
			code: "SAME_ORIGIN_REQUIRED",
			message: "Mutation requests must be same-origin.",
		});
	});

	it("rejects foreign Origin headers", async () => {
		const response = assertSameOriginMutation(
			request("/api/example", {
				headers: { origin: "https://attacker.example" },
			}),
		);

		expect(response?.status).toBe(403);
		expect(response ? await readError(response) : null).toMatchObject({
			code: "SAME_ORIGIN_REQUIRED",
			message: "Mutation origin is not allowed.",
		});
	});

	it("rejects mutations without same-origin proof", async () => {
		const response = assertSameOriginMutation(request("/api/example"));

		expect(response?.status).toBe(403);
		expect(response ? await readError(response) : null).toMatchObject({
			code: "SAME_ORIGIN_REQUIRED",
			message: "Mutation requests require same-origin proof.",
		});
	});

	it("keeps Auth.js and the token-protected revalidation endpoint exempt", () => {
		expect(
			assertSameOriginMutation(request("/api/auth/callback/discord")),
		).toBeNull();
		expect(assertSameOriginMutation(request("/api/revalidate-tag"))).toBeNull();
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

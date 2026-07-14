//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/server/rate-limit.ts                                                                 ////
//// Language: TS                                                                                                ////
//// Shared PostgreSQL-backed route limiter for abuse-sensitive app and API endpoints.                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { query } from "@/lib/data/pg";

export type RateLimitConfig = {
	request: Request;
	bucket: string;
	limit: number;
	windowMs: number;
	identity?: string | null;
};

type RateLimitResultRow = {
	allowed_flag: boolean;
	retry_after_seconds: number | string;
};

function readFirstHeaderValue(value: string | null): string | null {
	if (!value) {
		return null;
	}

	const first = value.split(",")[0]?.trim();
	return first && first.length > 0 ? first : null;
}

function trustProxyHeaders(): boolean {
	return process.env.CM_TRUST_PROXY_HEADERS?.trim().toLowerCase() === "true";
}

function readClientAddress(request: Request): string {
	if (!trustProxyHeaders()) {
		return "untrusted-proxy";
	}

	const cfConnectingIp = readFirstHeaderValue(
		request.headers.get("cf-connecting-ip"),
	);
	if (cfConnectingIp) {
		return cfConnectingIp;
	}

	const forwardedFor = readFirstHeaderValue(
		request.headers.get("x-forwarded-for"),
	);
	if (forwardedFor) {
		return forwardedFor;
	}

	const realIp = readFirstHeaderValue(request.headers.get("x-real-ip"));
	return realIp ?? "unknown";
}

function buildIdentity(config: RateLimitConfig): string {
	const explicitIdentity = config.identity?.trim();
	return explicitIdentity
		? `actor:${explicitIdentity}`
		: `ip:${readClientAddress(config.request)}`;
}

function buildIdentityHash(config: RateLimitConfig): string {
	return createHash("sha256")
		.update(`${config.bucket}\0${buildIdentity(config)}`, "utf8")
		.digest("hex");
}

function readRetryAfterSeconds(value: number | string): number {
	const parsed = typeof value === "number" ? value : Number(value);
	return Number.isFinite(parsed) ? Math.max(1, Math.ceil(parsed)) : 30;
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Unknown rate-limit error.";
}

export async function checkRateLimit(
	config: RateLimitConfig,
): Promise<NextResponse | null> {
	try {
		const result = await query<RateLimitResultRow>(
			`
				SELECT allowed_flag,
				       retry_after_seconds
				FROM web_api.web_consume_rate_limit($1, $2, $3, $4)
			`,
			[config.bucket, buildIdentityHash(config), config.limit, config.windowMs],
		);
		const row = result.rows[0];

		if (!row) {
			throw new Error("Rate-limit function returned no row.");
		}

		if (row.allowed_flag) {
			return null;
		}

		const retryAfterSeconds = readRetryAfterSeconds(row.retry_after_seconds);
		return NextResponse.json(
			{
				ok: false,
				code: "RATE_LIMITED",
				message: "Too many requests. Please try again shortly.",
			},
			{
				status: 429,
				headers: {
					"Retry-After": String(retryAfterSeconds),
				},
			},
		);
	} catch (error: unknown) {
		console.error(
			"[rate-limit] Shared limiter unavailable:",
			errorMessage(error),
		);
		return NextResponse.json(
			{
				ok: false,
				code: "RATE_LIMIT_UNAVAILABLE",
				message: "Request protection is temporarily unavailable.",
			},
			{
				status: 503,
				headers: {
					"Retry-After": "30",
				},
			},
		);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

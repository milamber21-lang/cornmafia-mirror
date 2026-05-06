//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/server/rate-limit.ts                                                                 ////
//// Language: TS                                                                                               ////
//// Lightweight in-process route rate limiter for abuse-sensitive app and API endpoints.                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { NextResponse } from "next/server";

type RateLimitBucket = {
	count: number;
	resetAt: number;
};

export type RateLimitConfig = {
	request: Request;
	bucket: string;
	limit: number;
	windowMs: number;
	identity?: string | null;
};

const buckets = new Map<string, RateLimitBucket>();
const MAX_BUCKETS = 5000;

function readFirstHeaderValue(value: string | null): string | null {
	if (!value) {
		return null;
	}

	const first = value.split(",")[0]?.trim();
	return first && first.length > 0 ? first : null;
}

function readClientAddress(request: Request): string {
	const forwardedFor = readFirstHeaderValue(request.headers.get("x-forwarded-for"));
	if (forwardedFor) {
		return forwardedFor;
	}

	const realIp = readFirstHeaderValue(request.headers.get("x-real-ip"));
	if (realIp) {
		return realIp;
	}

	const cfConnectingIp = readFirstHeaderValue(
		request.headers.get("cf-connecting-ip"),
	);
	if (cfConnectingIp) {
		return cfConnectingIp;
	}

	return "unknown";
}

function cleanupExpiredBuckets(now: number): void {
	if (buckets.size <= MAX_BUCKETS) {
		return;
	}

	for (const [key, bucket] of buckets.entries()) {
		if (bucket.resetAt <= now) {
			buckets.delete(key);
		}
	}

	if (buckets.size <= MAX_BUCKETS) {
		return;
	}

	const overflowCount = buckets.size - MAX_BUCKETS;
	let removed = 0;
	for (const key of buckets.keys()) {
		buckets.delete(key);
		removed += 1;
		if (removed >= overflowCount) {
			return;
		}
	}
}

function buildRateLimitKey(config: RateLimitConfig): string {
	const identity = config.identity?.trim()
		? `actor:${config.identity.trim()}`
		: `ip:${readClientAddress(config.request)}`;

	return `${config.bucket}:${identity}`;
}

export function checkRateLimit(config: RateLimitConfig): NextResponse | null {
	const now = Date.now();
	const key = buildRateLimitKey(config);
	const existing = buckets.get(key);
	const resetAt = existing && existing.resetAt > now
		? existing.resetAt
		: now + config.windowMs;
	const count = existing && existing.resetAt > now ? existing.count + 1 : 1;

	buckets.set(key, { count, resetAt });
	cleanupExpiredBuckets(now);

	if (count <= config.limit) {
		return null;
	}

	const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
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
}

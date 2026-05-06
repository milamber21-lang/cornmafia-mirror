//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/revalidate-tag/route.ts                                                        ////
//// Language: TS                                                                                               ////
//// Header-authenticated POST-only cache-tag revalidation endpoint for controlled cache refreshes.             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { timingSafeEqual } from "crypto";

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getRequiredSecretEnv } from "@/lib/server/env";
import { assertSameOriginMutation } from "@/lib/server/mutation-origin";
import { checkRateLimit } from "@/lib/server/rate-limit";

const REVALIDATE_TAG_MAX_LENGTH = 128;
const REVALIDATE_RATE_LIMIT_WINDOW_MS = 60_000;
const REVALIDATE_RATE_LIMIT_COUNT = 30;
const ALLOWED_REVALIDATE_TAG_PREFIXES = [
	"actor:",
	"auth:",
	"category:",
	"content:",
	"discord:",
	"icon:",
	"map:",
	"media:",
	"member:",
	"navigation:",
	"public:",
	"series:",
	"subcategory:",
	"template:",
	"theme:",
	"web:",
	"youtube:",
] as const;
const REVALIDATE_TAG_PATTERN = /^[a-z0-9][a-z0-9:._/-]*$/;

type RevalidateBody = {
	tag?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function methodNotAllowed(): NextResponse {
	return NextResponse.json(
		{ ok: false, error: "Method not allowed" },
		{
			status: 405,
			headers: {
				Allow: "POST",
			},
		},
	);
}

function readBearerToken(value: string | null): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	const prefix = "bearer ";
	if (!trimmedValue.toLowerCase().startsWith(prefix)) {
		return null;
	}

	const token = trimmedValue.slice(prefix.length).trim();
	return token.length > 0 ? token : null;
}

function readHeaderToken(req: Request): string | null {
	const bearerToken = readBearerToken(req.headers.get("authorization"));
	if (bearerToken) {
		return bearerToken;
	}

	const headerToken = req.headers.get("x-revalidate-token")?.trim() ?? "";
	return headerToken.length > 0 ? headerToken : null;
}

function constantTimeEquals(left: string, right: string): boolean {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);
	return (
		leftBuffer.length === rightBuffer.length &&
		timingSafeEqual(leftBuffer, rightBuffer)
	);
}

function rejectUrlParams(req: Request): NextResponse | null {
	const url = new URL(req.url);
	if (url.searchParams.has("secret") || url.searchParams.has("tag")) {
		return NextResponse.json(
			{
				ok: false,
				error: "Use POST JSON and a token header; URL secrets and URL tags are not accepted.",
			},
			{ status: 400 },
		);
	}

	return null;
}

function assertAuthorized(req: Request): NextResponse | null {
	let expectedToken = "";
	try {
		expectedToken = getRequiredSecretEnv("REVALIDATE_TOKEN", 32);
	} catch {
		return NextResponse.json(
			{ ok: false, error: "Revalidation is not configured." },
			{ status: 503 },
		);
	}

	const actualToken = readHeaderToken(req);
	if (!actualToken || !constantTimeEquals(actualToken, expectedToken)) {
		return NextResponse.json(
			{ ok: false, error: "Unauthorized" },
			{ status: 401 },
		);
	}

	return null;
}

function assertJsonRequest(req: Request): NextResponse | null {
	const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
	if (!contentType.includes("application/json")) {
		return NextResponse.json(
			{ ok: false, error: "Content-Type must be application/json." },
			{ status: 415 },
		);
	}

	return null;
}

async function readRevalidateBody(req: Request): Promise<RevalidateBody | null> {
	try {
		const json = (await req.json()) as unknown;
		return isRecord(json) ? json : null;
	} catch {
		return null;
	}
}

function normalizeRevalidateTag(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalizedTag = value.trim();
	return normalizedTag.length > 0 ? normalizedTag : null;
}

function validateRevalidateTag(tag: string): string | null {
	if (tag.length > REVALIDATE_TAG_MAX_LENGTH) {
		return `Tag must be ${REVALIDATE_TAG_MAX_LENGTH} characters or fewer.`;
	}

	if (!REVALIDATE_TAG_PATTERN.test(tag)) {
		return "Tag contains unsupported characters.";
	}

	if (!ALLOWED_REVALIDATE_TAG_PREFIXES.some((prefix) => tag.startsWith(prefix))) {
		return "Tag prefix is not allowed.";
	}

	return null;
}

function revalidateRequestedTag(tag: string): NextResponse {
	const validationError = validateRevalidateTag(tag);
	if (validationError) {
		return NextResponse.json(
			{ ok: false, error: validationError },
			{ status: 400 },
		);
	}

	revalidateTag(tag, "max");
	return NextResponse.json(
		{ ok: true, revalidated: tag },
		{ status: 200 },
	);
}

export async function GET(): Promise<NextResponse> {
	return methodNotAllowed();
}

export async function POST(req: Request): Promise<NextResponse> {
	const sameOriginResponse = assertSameOriginMutation(req);
	if (sameOriginResponse) {
		return sameOriginResponse;
	}

	const rateLimitResponse = checkRateLimit({
		request: req,
		bucket: "revalidate-tag",
		limit: REVALIDATE_RATE_LIMIT_COUNT,
		windowMs: REVALIDATE_RATE_LIMIT_WINDOW_MS,
	});
	if (rateLimitResponse) {
		return rateLimitResponse;
	}

	const urlParamResponse = rejectUrlParams(req);
	if (urlParamResponse) {
		return urlParamResponse;
	}

	const jsonRequestResponse = assertJsonRequest(req);
	if (jsonRequestResponse) {
		return jsonRequestResponse;
	}

	const unauthorized = assertAuthorized(req);
	if (unauthorized) {
		return unauthorized;
	}

	const body = await readRevalidateBody(req);
	const tag = normalizeRevalidateTag(body?.tag);
	if (!tag) {
		return NextResponse.json(
			{ ok: false, error: "Missing tag" },
			{ status: 400 },
		);
	}

	return revalidateRequestedTag(tag);
}

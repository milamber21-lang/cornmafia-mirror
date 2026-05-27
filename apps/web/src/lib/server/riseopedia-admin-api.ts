//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/server/riseopedia-admin-api.ts                                                    ////
//// Language: TS                                                                                             ////
//// Shared parser helpers for Riseopedia admin infrastructure API routes.                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { NextResponse } from "next/server";

import {
	jsonError,
	normalizeCode,
	normalizeNonEmptyString,
	normalizeNullableString,
	parseNonNegativeInt,
	parsePositiveInt,
	parseRequiredBoolean,
	requireActorDiscordId,
	type ApiErrorCode,
} from "@/lib/server/admin-route";

export type ObjectBody = {
	[key: string]: unknown;
};

export function asObject(value: unknown): ObjectBody | null {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as ObjectBody)
		: null;
}

export async function readObjectBody(request: Request): Promise<ObjectBody | NextResponse> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonError("VALIDATION_REQUIRED", "Invalid JSON body.", 400);
	}

	const payload = asObject(body);
	return payload ?? jsonError("VALIDATION_REQUIRED", "Invalid request body.", 400);
}

export async function requireRiseopediaAdminActor(): Promise<string | NextResponse> {
	return requireActorDiscordId();
}

export function classifyRiseopediaAdminError(error: unknown): {
	code: ApiErrorCode;
	status: number;
	message: string;
} {
	const message = error instanceof Error ? error.message : "Failed to process Riseopedia admin request.";
	const normalized = message.toLowerCase();

	if (normalized.includes("not found") || normalized.includes("was not found")) {
		return { code: "NOT_FOUND", message, status: 404 };
	}

	if (
		normalized.includes("required") ||
		normalized.includes("invalid") ||
		normalized.includes("duplicate") ||
		normalized.includes("exists") ||
		normalized.includes("violates") ||
		normalized.includes("cannot") ||
		normalized.includes("must")
	) {
		return { code: "VALIDATION_REQUIRED", message, status: 400 };
	}

	return { code: "SERVER_ERROR", message, status: 500 };
}

export function getOp(payload: ObjectBody): string | null {
	return typeof payload.op === "string" && payload.op.trim().length > 0
		? payload.op.trim()
		: null;
}

export function getData(payload: ObjectBody): ObjectBody | null {
	return asObject(payload.data);
}

export function getOptionalId(payload: ObjectBody, key = "id"): number | null {
	const value = payload[key];
	if (value === null || value === undefined || value === "") {
		return null;
	}

	return parsePositiveInt(value);
}

export function getRequiredId(payload: ObjectBody, key = "id"): number | null {
	return parsePositiveInt(payload[key]);
}

export function getRequiredString(data: ObjectBody, key: string): string | null {
	return normalizeNonEmptyString(data[key]);
}

export function getNullableString(data: ObjectBody, key: string): string | null {
	return normalizeNullableString(data[key]);
}

export function getRequiredCode(data: ObjectBody, key: string): string | null {
	return normalizeCode(data[key]);
}

export function getRequiredBoolean(data: ObjectBody, key: string): boolean | null {
	return parseRequiredBoolean(data[key]);
}

export function getBoolean(data: ObjectBody, key: string, fallback: boolean): boolean {
	return parseRequiredBoolean(data[key]) ?? fallback;
}

export function getNonNegativeInt(data: ObjectBody, key: string, fallback: number): number {
	return parseNonNegativeInt(data[key]) ?? fallback;
}

export function getPositiveInt(data: ObjectBody, key: string): number | null {
	return parsePositiveInt(data[key]);
}

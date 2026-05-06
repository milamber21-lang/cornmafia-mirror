//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/me/route.ts                                                                      ////
//// Language: TS                                                                                                ////
//// DB-first member profile API for the signed-in actor.                                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextRequest, NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth/auth";
import {
	isMemberThemeStyleCode,
	normalizeMemberThemeStyleCode,
	readOwnProfile,
	updateOwnProfile,
	type EditableProfilePayload,
	type MemberThemeStyleCode,
	type ProfilePayload,
} from "@/lib/data/member-profile";
import { readDiscordIdFromSession } from "@/lib/server/current-actor";

export const dynamic = "force-dynamic";

const THEME_COOKIE_NAME = "cm_theme";
const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

type PickEditableResult = {
	updates: EditableProfilePayload;
	error: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown): string | null | undefined {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	}

	return value === null ? null : undefined;
}

function nullableThemeStyleCode(
	value: unknown,
): MemberThemeStyleCode | null | undefined {
	if (value === null) {
		return "vintage";
	}

	if (typeof value !== "string") {
		return undefined;
	}

	const trimmed = value.trim().toLowerCase();
	if (trimmed.length === 0) {
		return "vintage";
	}

	return isMemberThemeStyleCode(trimmed) ? trimmed : undefined;
}

function pickEditable(body: unknown): PickEditableResult {
	const out: EditableProfilePayload = {};
	if (!isRecord(body)) {
		return { updates: out, error: null };
	}

	const gameUsername = nullableString(body.gameUsername);
	if (gameUsername !== undefined) {
		out.gameUsername = gameUsername;
	}

	const alias = nullableString(body.alias);
	if (alias !== undefined) {
		out.alias = alias;
	}

	const hasThemeStyleCode = Object.prototype.hasOwnProperty.call(
		body,
		"themeStyleCode",
	);
	const hasLegacyTheme = Object.prototype.hasOwnProperty.call(body, "theme");
	if (hasThemeStyleCode || hasLegacyTheme) {
		const themeInput = hasThemeStyleCode ? body.themeStyleCode : body.theme;
		const themeStyleCode = nullableThemeStyleCode(themeInput);
		if (themeStyleCode === undefined) {
			return {
				updates: out,
				error: "Theme must be dark, light, or vintage.",
			};
		}

		out.themeStyleCode = themeStyleCode;
	}

	const notes = nullableString(body.notes);
	if (notes !== undefined) {
		out.notes = notes;
	}

	return { updates: out, error: null };
}

function readThemeStyleCodeFromProfile(doc: ProfilePayload): MemberThemeStyleCode {
	return normalizeMemberThemeStyleCode(doc.theme.key);
}

function setThemeCookie(
	response: NextResponse,
	themeStyleCode: MemberThemeStyleCode,
): NextResponse {
	response.cookies.set({
		name: THEME_COOKIE_NAME,
		value: themeStyleCode,
		path: "/",
		maxAge: THEME_COOKIE_MAX_AGE_SECONDS,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
	});

	return response;
}

function profileResponse(doc: ProfilePayload): NextResponse {
	const response = NextResponse.json(doc);
	return setThemeCookie(response, readThemeStyleCodeFromProfile(doc));
}

export async function GET() {
	const session = await getAuthSession();
	const actorDiscordId = readDiscordIdFromSession(session);

	if (!actorDiscordId) {
		return NextResponse.json(
			{ ok: false, error: "Sign in required." },
			{ status: 401 },
		);
	}

	try {
		const doc = await readOwnProfile(actorDiscordId);
		if (!doc) {
			return NextResponse.json(
				{ ok: false, error: "Profile was not found." },
				{ status: 404 },
			);
		}

		return profileResponse(doc);
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to load profile.";
		return NextResponse.json({ ok: false, error: message }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest) {
	const session = await getAuthSession();
	const actorDiscordId = readDiscordIdFromSession(session);

	if (!actorDiscordId) {
		return NextResponse.json(
			{ ok: false, error: "Sign in required." },
			{ status: 401 },
		);
	}

	let body: unknown = {};
	try {
		body = await req.json();
	} catch {
		body = {};
	}

	const picked = pickEditable(body);
	if (picked.error) {
		return NextResponse.json(
			{ ok: false, error: picked.error },
			{ status: 400 },
		);
	}

	try {
		await updateOwnProfile({
			actorDiscordId,
			updates: picked.updates,
		});

		const doc = await readOwnProfile(actorDiscordId);
		if (!doc) {
			return NextResponse.json(
				{ ok: false, error: "Profile was not found after save." },
				{ status: 404 },
			);
		}

		return profileResponse(doc);
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to update profile.";
		return NextResponse.json({ ok: false, error: message }, { status: 500 });
	}
}

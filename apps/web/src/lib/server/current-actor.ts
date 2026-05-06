//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/server/current-actor.ts                                                              ////
//// Language: TS                                                                                                ////
//// Shared server helper for reading the current public actor identity from the auth session                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { getAuthSession } from "@/lib/auth/auth";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readDiscordIdFromSession(session: unknown): string | null {
	if (!isRecord(session)) {
		return null;
	}

	const user = session.user;
	if (!isRecord(user)) {
		return null;
	}

	const discordId = user.discordId;
	return typeof discordId === "string" && discordId.trim().length > 0
		? discordId.trim()
		: null;
}

export async function getCurrentActorDiscordId(): Promise<string | null> {
	const session = await getAuthSession();
	return readDiscordIdFromSession(session);
}

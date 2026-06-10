//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/server/current-actor.ts                                                              ////
//// Language: TS                                                                                                ////
//// Shared server helper for resolving a fresh current actor identity from the auth session and DB role cache.  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { resolveAccessForUser } from "@/lib/access/resolve";
import { getAuthSession, verifyDiscordRolesIfDue } from "@/lib/auth/auth";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNonEmptyString(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

export function readDiscordIdFromSession(session: unknown): string | null {
	if (!isRecord(session)) {
		return null;
	}

	const user = session.user;
	if (!isRecord(user)) {
		return null;
	}

	return readNonEmptyString(user.discordId);
}

export function readAuthUserIdFromSession(session: unknown): string | null {
	if (!isRecord(session)) {
		return null;
	}

	const user = session.user;
	if (!isRecord(user)) {
		return null;
	}

	return readNonEmptyString(user.id);
}

async function getFreshActorDiscordId(params: {
	authUserId: string | null;
	discordUserId: string | null;
}): Promise<string | null> {
	if (!params.discordUserId) {
		return null;
	}

	let access = await resolveAccessForUser(params.discordUserId);

	if (access.isRoleRefreshDue) {
		if (!params.authUserId) {
			return null;
		}

		const refreshed = await verifyDiscordRolesIfDue({
			authUserId: params.authUserId,
			discordUserId: params.discordUserId,
		});

		if (!refreshed) {
			return null;
		}

		access = await resolveAccessForUser(params.discordUserId);
	}

	if (!access.isAuthenticated || access.isRoleRefreshDue) {
		return null;
	}

	return params.discordUserId;
}

export async function getCurrentActorDiscordId(): Promise<string | null> {
	const session = await getAuthSession();

	return getFreshActorDiscordId({
		authUserId: readAuthUserIdFromSession(session),
		discordUserId: readDiscordIdFromSession(session),
	});
}

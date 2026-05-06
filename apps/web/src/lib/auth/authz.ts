//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/auth/authz.ts                                                                         ////
//// Language: TS                                                                                                 ////
//// Admin and editor guards backed by DB access and stale-role verification                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import "server-only";

import { resolveAccessForUser } from "@/lib/access/resolve";
import { getAuthSession, verifyDiscordRolesIfDue } from "@/lib/auth/auth";

type GuardResult =
	| { allowed: true }
	| {
			allowed: false;
			reason:
				| "not-authenticated"
				| "not-admin"
				| "not-editor"
				| "not-admin-or-editor"
				| "role-refresh-failed";
	  };

type SessionUserShape = {
	id?: string;
	discordId?: string | null;
};

type PrivilegeState = {
	discordId: string | null;
	authUserId: string | null;
	isAdmin: boolean;
	isEditor: boolean;
	isRoleRefreshDue: boolean;
};

async function getSessionUser(): Promise<SessionUserShape | null> {
	const session = await getAuthSession();
	const user = (session?.user ?? null) as SessionUserShape | null;

	if (!user?.discordId) {
		return null;
	}

	return user;
}

async function getPrivilegeState(): Promise<PrivilegeState> {
	const sessionUser = await getSessionUser();

	if (!sessionUser?.discordId) {
		return {
			discordId: null,
			authUserId: null,
			isAdmin: false,
			isEditor: false,
			isRoleRefreshDue: false,
		};
	}

	let access = await resolveAccessForUser(sessionUser.discordId);

	if (access.isRoleRefreshDue && sessionUser.id) {
		const verified = await verifyDiscordRolesIfDue({
			authUserId: sessionUser.id,
			discordUserId: sessionUser.discordId,
		});

		if (!verified) {
			return {
				discordId: sessionUser.discordId,
				authUserId: sessionUser.id,
				isAdmin: false,
				isEditor: false,
				isRoleRefreshDue: true,
			};
		}

		access = await resolveAccessForUser(sessionUser.discordId);
	}

	return {
		discordId: sessionUser.discordId,
		authUserId: sessionUser.id ?? access.authUserId,
		isAdmin: access.flags.isAdmin,
		isEditor: access.flags.isEditor,
		isRoleRefreshDue: access.isRoleRefreshDue,
	};
}

export async function requireAdmin(): Promise<GuardResult> {
	const state = await getPrivilegeState();

	if (!state.discordId) {
		return { allowed: false, reason: "not-authenticated" };
	}

	if (state.isRoleRefreshDue) {
		return { allowed: false, reason: "role-refresh-failed" };
	}

	return state.isAdmin
		? { allowed: true }
		: { allowed: false, reason: "not-admin" };
}

export async function requireEditor(): Promise<GuardResult> {
	const state = await getPrivilegeState();

	if (!state.discordId) {
		return { allowed: false, reason: "not-authenticated" };
	}

	if (state.isRoleRefreshDue) {
		return { allowed: false, reason: "role-refresh-failed" };
	}

	return state.isEditor
		? { allowed: true }
		: { allowed: false, reason: "not-editor" };
}

export async function requireAdminOrEditor(): Promise<GuardResult> {
	const state = await getPrivilegeState();

	if (!state.discordId) {
		return { allowed: false, reason: "not-authenticated" };
	}

	if (state.isRoleRefreshDue) {
		return { allowed: false, reason: "role-refresh-failed" };
	}

	if (state.isAdmin || state.isEditor) {
		return { allowed: true };
	}

	return { allowed: false, reason: "not-admin-or-editor" };
}

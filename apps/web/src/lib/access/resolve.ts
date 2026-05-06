//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/access/resolve.ts                                                                     ////
//// Language: TS                                                                                                 ////
//// Resolve current access from web_view-backed auth cache                                                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import "server-only";

import { colorIntToHex } from "@/lib/discord/guild";
import { query } from "@/lib/data/pg";
import {
	getDiscordRolesIndex,
	type DiscordRoleDoc,
} from "@/lib/access/roles-index";

export type RoleLite = {
	rank?: number;
	isAdmin?: boolean;
	isEditor?: boolean;
};

export type ResolvedAccess = {
	authUserId: string | null;
	discordUserId: string | null;
	roleIds: string[];
	matchedRoles: DiscordRoleDoc[];
	rolesLite: RoleLite[];
	effectiveRank: number;
	flags: { isAdmin: boolean; isEditor: boolean };
	defaults: { publicRank: number; authRank: number };
	isAuthenticated: boolean;
	isMember: boolean;
	isRoleRefreshDue: boolean;
};

type DiscordActorAccessRow = {
	discord_user_id: string | number;
	auth_user_id: string | number;
	discord_id: string;
	is_member: boolean;
	is_role_refresh_due: boolean;
	is_authenticated: boolean;
	is_admin: boolean;
	is_editor: boolean;
	max_rank: number;
};

type AuthUserLookupRow = {
	auth_user_id: string | number;
	discord_id: string | null;
	is_disabled: boolean;
};

type DiscordUserCachedRoleRow = {
	discord_role_id: string;
	configured_role_id: string | number | null;
	name: string;
	source: string;
	color_hex: string | null;
	color_integer: number | null;
	rank: number;
	is_public_default: boolean;
	is_authenticated_default: boolean;
	is_admin: boolean;
	is_editor: boolean;
};

function buildRoleDoc(row: DiscordUserCachedRoleRow): DiscordRoleDoc {
	return {
		id:
			row.configured_role_id !== null
				? String(row.configured_role_id)
				: `cache:${row.discord_role_id}`,
		name: row.name,
		source: row.source === "virtual" ? "virtual" : "discord",
		roleId: row.discord_role_id,
		colorHex: row.color_hex ?? colorIntToHex(row.color_integer) ?? null,
		rank: row.rank,
		isPublicDefault: row.is_public_default,
		isAuthenticatedDefault: row.is_authenticated_default,
		isAdmin: row.is_admin,
		isEditor: row.is_editor,
	};
}

async function getAuthenticatedUser(
	discordUserId: string,
): Promise<AuthUserLookupRow | null> {
	const result = await query<AuthUserLookupRow>(
		`
			SELECT
				auth_user_id,
				discord_id,
				is_disabled
			FROM web_view.auth_users
			WHERE discord_id = $1
			LIMIT 1
		`,
		[discordUserId],
	);

	return result.rows[0] ?? null;
}

async function getActorAccessRow(
	discordUserId: string,
): Promise<DiscordActorAccessRow | null> {
	const result = await query<DiscordActorAccessRow>(
		`
			SELECT
				discord_user_id,
				auth_user_id,
				discord_id,
				is_member,
				is_role_refresh_due,
				is_authenticated,
				is_admin,
				is_editor,
				max_rank
			FROM web_view.discord_actor_access
			WHERE discord_id = $1
			LIMIT 1
		`,
		[discordUserId],
	);

	return result.rows[0] ?? null;
}

async function getCachedRoles(discordUserId: string): Promise<{
	roleIds: string[];
	matchedRoles: DiscordRoleDoc[];
}> {
	const result = await query<DiscordUserCachedRoleRow>(
		`
			SELECT
				discord_role_id,
				configured_role_id,
				name,
				source,
				color_hex,
				color_integer,
				rank,
				is_public_default,
				is_authenticated_default,
				is_admin,
				is_editor
			FROM web_view.discord_user_cached_roles
			WHERE discord_id = $1
			ORDER BY rank DESC, name ASC
		`,
		[discordUserId],
	);

	const roleIds = result.rows.map(
		(row: DiscordUserCachedRoleRow) => row.discord_role_id,
	);
	const matchedRoles = result.rows.map((row: DiscordUserCachedRoleRow) =>
		buildRoleDoc(row),
	);

	return {
		roleIds,
		matchedRoles,
	};
}

export async function resolveAccessForUser(
	discordUserId?: string | null,
): Promise<ResolvedAccess> {
	const index = await getDiscordRolesIndex();
	const publicRank = index.publicDefault?.rank ?? 0;

	if (!discordUserId) {
		const publicDefaults: RoleLite[] = [];

		if (index.publicDefault) {
			publicDefaults.push({
				rank: index.publicDefault.rank,
				isAdmin: index.publicDefault.isAdmin,
				isEditor: index.publicDefault.isEditor,
			});
		}

		return {
			authUserId: null,
			discordUserId: null,
			roleIds: [],
			matchedRoles: [],
			rolesLite: publicDefaults,
			effectiveRank: publicRank,
			flags: {
				isAdmin: index.publicDefault?.isAdmin === true,
				isEditor: index.publicDefault?.isEditor === true,
			},
			defaults: {
				publicRank,
				authRank: 0,
			},
			isAuthenticated: false,
			isMember: false,
			isRoleRefreshDue: false,
		};
	}

	const authUser = await getAuthenticatedUser(discordUserId);
	const isAuthenticated = authUser !== null && authUser.is_disabled === false;
	const authRank = isAuthenticated ? (index.authenticatedDefault?.rank ?? 0) : 0;
	const rolesLite: RoleLite[] = [];

	if (index.publicDefault) {
		rolesLite.push({
			rank: index.publicDefault.rank,
			isAdmin: index.publicDefault.isAdmin,
			isEditor: index.publicDefault.isEditor,
		});
	}

	if (isAuthenticated && index.authenticatedDefault) {
		rolesLite.push({
			rank: index.authenticatedDefault.rank,
			isAdmin: index.authenticatedDefault.isAdmin,
			isEditor: index.authenticatedDefault.isEditor,
		});
	}

	if (!isAuthenticated) {
		return {
			authUserId: null,
			discordUserId: null,
			roleIds: [],
			matchedRoles: [],
			rolesLite,
			effectiveRank: publicRank,
			flags: {
				isAdmin: index.publicDefault?.isAdmin === true,
				isEditor: index.publicDefault?.isEditor === true,
			},
			defaults: {
				publicRank,
				authRank: 0,
			},
			isAuthenticated: false,
			isMember: false,
			isRoleRefreshDue: false,
		};
	}

	const actorAccess = await getActorAccessRow(discordUserId);

	if (!actorAccess) {
		return {
			authUserId: String(authUser.auth_user_id),
			discordUserId: null,
			roleIds: [],
			matchedRoles: [],
			rolesLite,
			effectiveRank: Math.max(publicRank, authRank),
			flags: {
				isAdmin:
					index.publicDefault?.isAdmin === true ||
					index.authenticatedDefault?.isAdmin === true,
				isEditor:
					index.publicDefault?.isEditor === true ||
					index.authenticatedDefault?.isEditor === true,
			},
			defaults: {
				publicRank,
				authRank,
			},
			isAuthenticated: true,
			isMember: false,
			isRoleRefreshDue: true,
		};
	}

	const cachedRoles = await getCachedRoles(discordUserId);
	const realRoles: RoleLite[] = cachedRoles.matchedRoles.map((role) => ({
		rank: role.rank,
		isAdmin: role.isAdmin,
		isEditor: role.isEditor,
	}));

	return {
		authUserId: String(actorAccess.auth_user_id),
		discordUserId: String(actorAccess.discord_user_id),
		roleIds: cachedRoles.roleIds,
		matchedRoles: cachedRoles.matchedRoles,
		rolesLite: [...realRoles, ...rolesLite],
		effectiveRank: actorAccess.max_rank,
		flags: {
			isAdmin: actorAccess.is_admin,
			isEditor: actorAccess.is_editor,
		},
		defaults: {
			publicRank,
			authRank,
		},
		isAuthenticated: actorAccess.is_authenticated,
		isMember: actorAccess.is_member,
		isRoleRefreshDue: actorAccess.is_role_refresh_due,
	};
}

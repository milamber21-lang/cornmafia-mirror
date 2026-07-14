//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/access/roles-index.ts                                                              ////
//// Language: TS                                                                                               ////
//// Cached Discord role index read from DB-backed role lookup surfaces.                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { query } from "@/lib/data/pg";

type RoleSource = "discord" | "virtual";

type DiscordRoleRow = {
	id: number | string;
	name: string;
	source: string;
	role_id: string | null;
	color_hex: string | null;
	rank: number;
	is_public_default: boolean;
	is_authenticated_default: boolean;
	is_admin: boolean;
	is_editor: boolean;
};

export interface DiscordRoleDoc {
	id: string;
	name: string;
	source: RoleSource;
	roleId: string | null;
	colorHex: string | null;
	rank: number;
	isPublicDefault: boolean;
	isAuthenticatedDefault: boolean;
	isAdmin: boolean;
	isEditor: boolean;
}

export interface DiscordRolesIndex {
	byRoleId: Record<string, DiscordRoleDoc>;
	publicDefault?: DiscordRoleDoc;
	authenticatedDefault?: DiscordRoleDoc;
	fetchedAt: number;
}

const CACHE_TTL_MS = 30 * 1000;

let cache: { data?: DiscordRolesIndex; expiresAt: number } = {
	data: undefined,
	expiresAt: 0,
};

function toRoleSource(value: string): RoleSource {
	if (value === "discord" || value === "virtual") {
		return value;
	}

	throw new Error(`Unsupported discord_roles.source value: ${value}`);
}

function mapRowToDoc(row: DiscordRoleRow): DiscordRoleDoc {
	return {
		id: String(row.id),
		name: row.name,
		source: toRoleSource(row.source),
		roleId: row.role_id,
		colorHex: row.color_hex,
		rank: row.rank,
		isPublicDefault: row.is_public_default,
		isAuthenticatedDefault: row.is_authenticated_default,
		isAdmin: row.is_admin,
		isEditor: row.is_editor,
	};
}

export function clearDiscordRolesIndexCache(): void {
	cache = {
		data: undefined,
		expiresAt: 0,
	};
}

export async function getDiscordRolesIndex(): Promise<DiscordRolesIndex> {
	const now = Date.now();

	if (cache.data && cache.expiresAt > now) {
		return cache.data;
	}

	const result = await query<DiscordRoleRow>(`
		SELECT
			id,
			name,
			source,
			role_id,
			color_hex,
			rank,
			is_public_default,
			is_authenticated_default,
			is_admin,
			is_editor
		FROM web_view.discord_roles
		ORDER BY id ASC
	`);

	const byRoleId: Record<string, DiscordRoleDoc> = {};
	let publicDefault: DiscordRoleDoc | undefined;
	let authenticatedDefault: DiscordRoleDoc | undefined;

	for (const row of result.rows) {
		const doc = mapRowToDoc(row);

		if (doc.isPublicDefault) {
			publicDefault = doc;
		}

		if (doc.isAuthenticatedDefault) {
			authenticatedDefault = doc;
		}

		if (
			doc.source === "discord" &&
			typeof doc.roleId === "string" &&
			doc.roleId.length > 0
		) {
			byRoleId[doc.roleId] = doc;
		}
	}

	const index: DiscordRolesIndex = {
		byRoleId,
		publicDefault,
		authenticatedDefault,
		fetchedAt: now,
	};

	cache = {
		data: index,
		expiresAt: now + CACHE_TTL_MS,
	};

	return index;
}

export function rankFromRoleIds(
	roleIds: readonly string[],
	index: DiscordRolesIndex,
): number {
	if (!Array.isArray(roleIds) || roleIds.length === 0) {
		return 0;
	}

	let maxRank = 0;

	for (const roleId of roleIds) {
		const doc = index.byRoleId[roleId];

		if (doc && doc.rank > maxRank) {
			maxRank = doc.rank;
		}
	}

	return maxRank;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

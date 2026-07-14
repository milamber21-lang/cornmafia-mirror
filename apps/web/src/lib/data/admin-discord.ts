//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/admin-discord.ts                                                              ////
//// Language: TS                                                                                              ////
//// DB-first admin Discord role and user data helpers extracted from route handlers.                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { query } from "@/lib/data/pg";

export type DiscordRoleAdminSortBy = "name" | "source" | "roleId" | "rank";

export type DiscordUserAdminSortBy =
	| "discordId"
	| "username"
	| "globalName"
	| "member"
	| "roleSync"
	| "notes";

export type DiscordAdminSortDir = "asc" | "desc";

export type DiscordRoleSourceCode = "discord" | "virtual";

type DiscordRoleViewRow = {
	id: number | string;
	name: string;
	source: string;
	role_id: string | null;
	color_hex: string | null;
	rank: number;
	is_access_role: boolean;
	is_public_default: boolean;
	is_authenticated_default: boolean;
	is_admin: boolean;
	is_editor: boolean;
	created_dt: string | Date;
	updated_dt: string | Date;
};

export type DiscordRoleAdminItem = {
	id: string;
	name: string;
	source: DiscordRoleSourceCode;
	roleId: string | null;
	colorHex: string | null;
	rank: number;
	isAccessRole: boolean;
	fullEditorialAccess: boolean;
	isAdmin: boolean;
	isPublicDefault: boolean;
	isAuthenticatedDefault: boolean;
	createdAt: string;
	updatedAt: string;
};

export type DiscordRoleAdminPage = {
	rows: DiscordRoleAdminItem[];
	page: number;
	pageSize: number;
	totalDocs: number;
	totalPages: number;
};

type DiscordUserListRow = {
	discord_user_id: number | string;
	discord_id: string;
	username: string;
	global_name: string | null;
	is_member: boolean;
	roles_synced_dt: string | Date | null;
	last_login_dt: string | Date | null;
	is_role_refresh_due: boolean;
	notes: string | null;
	updated_dt: string | Date;
};

type DiscordUserDocRow = {
	discord_user_id: number | string;
	discord_id: string;
	username: string;
	global_name: string | null;
	is_member: boolean;
	joined_dt: string | Date | null;
	roles_synced_dt: string | Date | null;
	last_login_dt: string | Date | null;
	is_role_refresh_due: boolean;
	notes: string | null;
};

type DiscordUserRoleRow = {
	discord_role_id: string;
	name: string;
};

export type DiscordUserAdminItem = {
	id: string;
	discordId: string;
	username: string;
	globalName: string | null;
	isMember: boolean;
	rolesSyncedDt: string | null;
	lastLoginAt: string | null;
	isRoleRefreshDue: boolean;
	notes: string | null;
	updatedAt: string | null;
};

export type DiscordUserAdminPage = {
	rows: DiscordUserAdminItem[];
	page: number;
	pageSize: number;
	totalDocs: number;
	totalPages: number;
};

export type DiscordUserAdminDetail = {
	id: string;
	discordId: string;
	username: string;
	globalName: string | null;
	isMember: boolean;
	joinedDt: string | null;
	rolesSyncedDt: string | null;
	lastLoginAt: string | null;
	isRoleRefreshDue: boolean;
	notes: string;
	roles: Array<{
		roleId: string;
		name: string;
	}>;
};

type CountRow = {
	total_docs: number | string;
};

function toIsoString(value: string | Date | null): string | null {
	if (value === null) {
		return null;
	}

	return value instanceof Date
		? value.toISOString()
		: new Date(value).toISOString();
}

function normalizeRoleSource(value: unknown): DiscordRoleSourceCode {
	return value === "virtual" ? "virtual" : "discord";
}

function normalizeSortDir(
	sortDir: DiscordAdminSortDir | undefined,
): DiscordAdminSortDir {
	return sortDir === "desc" ? "desc" : "asc";
}

function buildDiscordRoleOrderBy(
	sortBy: DiscordRoleAdminSortBy | undefined,
	sortDir: DiscordAdminSortDir | undefined,
): string {
	const direction = normalizeSortDir(sortDir).toUpperCase();
	const nulls = direction === "ASC" ? "NULLS LAST" : "NULLS FIRST";

	switch (sortBy) {
		case "source":
			return `ORDER BY source ${direction}, name ${direction}, id ASC`;
		case "roleId":
			return `ORDER BY role_id ${direction} ${nulls}, name ${direction}, id ASC`;
		case "rank":
			return `ORDER BY rank ${direction}, name ${direction}, id ASC`;
		case "name":
		default:
			return `ORDER BY name ${direction}, id ASC`;
	}
}

function buildDiscordUserOrderBy(
	sortBy: DiscordUserAdminSortBy | undefined,
	sortDir: DiscordAdminSortDir | undefined,
): string {
	const direction = normalizeSortDir(sortDir).toUpperCase();
	const nulls = direction === "ASC" ? "NULLS LAST" : "NULLS FIRST";

	switch (sortBy) {
		case "discordId":
			return `ORDER BY discord_id ${direction}, discord_user_id ASC`;
		case "globalName":
			return `ORDER BY global_name ${direction} ${nulls}, username ${direction}, discord_user_id ASC`;
		case "member":
			return `ORDER BY is_member ${direction}, username ${direction}, discord_user_id ASC`;
		case "roleSync":
			return `ORDER BY roles_synced_dt ${direction} ${nulls}, username ${direction}, discord_user_id ASC`;
		case "notes":
			return `ORDER BY notes ${direction} ${nulls}, username ${direction}, discord_user_id ASC`;
		case "username":
		default:
			return `ORDER BY username ${direction}, discord_user_id ASC`;
	}
}

function mapRole(row: DiscordRoleViewRow): DiscordRoleAdminItem {
	return {
		id: String(row.id),
		name: row.name,
		source: normalizeRoleSource(row.source),
		roleId: row.role_id,
		colorHex: row.color_hex,
		rank: row.rank,
		isAccessRole: row.is_access_role,
		fullEditorialAccess: row.is_editor,
		isAdmin: row.is_admin,
		isPublicDefault: row.is_public_default,
		isAuthenticatedDefault: row.is_authenticated_default,
		createdAt: toIsoString(row.created_dt) ?? "",
		updatedAt: toIsoString(row.updated_dt) ?? "",
	};
}

function mapUser(row: DiscordUserListRow): DiscordUserAdminItem {
	return {
		id: String(row.discord_user_id),
		discordId: row.discord_id,
		username: row.username,
		globalName: row.global_name,
		isMember: row.is_member,
		rolesSyncedDt: toIsoString(row.roles_synced_dt),
		lastLoginAt: toIsoString(row.last_login_dt),
		isRoleRefreshDue: row.is_role_refresh_due,
		notes: row.notes,
		updatedAt: toIsoString(row.updated_dt),
	};
}

function parseRankSearch(value: string): number | null {
	const trimmedValue = value.trim();
	if (!/^\d+$/.test(trimmedValue)) {
		return null;
	}

	const parsedValue = Number(trimmedValue);
	if (
		!Number.isSafeInteger(parsedValue) ||
		parsedValue < 0 ||
		parsedValue > 2147483647
	) {
		return null;
	}

	return parsedValue;
}

export async function listDiscordRolesAdminPage(args: {
	search: string;
	page: number;
	pageSize: number;
	sortBy?: DiscordRoleAdminSortBy;
	sortDir?: DiscordAdminSortDir;
}): Promise<DiscordRoleAdminPage> {
	const search = args.search.trim();
	const numericQuery = parseRankSearch(search);
	const offset = (args.page - 1) * args.pageSize;
	const orderBy = buildDiscordRoleOrderBy(args.sortBy, args.sortDir);
	const [countResult, itemsResult] = await Promise.all([
		query<CountRow>(
			`
				SELECT COUNT(*) AS total_docs
				FROM web_view.discord_roles
				WHERE (
					$1 = ''
					OR name ILIKE ('%' || $1 || '%')
					OR COALESCE(role_id, '') ILIKE ('%' || $1 || '%')
					OR ($2::integer IS NOT NULL AND rank = $2::integer)
				)
			`,
			[search, numericQuery],
		),
		query<DiscordRoleViewRow>(
			`
				SELECT id,
					   name,
					   source,
					   role_id,
					   color_hex,
					   rank,
					   is_access_role,
					   is_public_default,
					   is_authenticated_default,
					   is_admin,
					   is_editor,
					   created_dt,
					   updated_dt
				FROM web_view.discord_roles
				WHERE (
					$1 = ''
					OR name ILIKE ('%' || $1 || '%')
					OR COALESCE(role_id, '') ILIKE ('%' || $1 || '%')
					OR ($2::integer IS NOT NULL AND rank = $2::integer)
				)
				${orderBy}
				LIMIT $3 OFFSET $4
			`,
			[search, numericQuery, args.pageSize, offset],
		),
	]);
	const totalDocs = Number(countResult.rows[0]?.total_docs ?? 0);
	const totalPages = totalDocs > 0 ? Math.ceil(totalDocs / args.pageSize) : 1;

	return {
		rows: itemsResult.rows.map(mapRole),
		page: args.page,
		pageSize: args.pageSize,
		totalDocs,
		totalPages,
	};
}

export async function findDiscordRoleAdminById(
	roleId: number,
): Promise<DiscordRoleAdminItem | null> {
	const result = await query<DiscordRoleViewRow>(
		`
			SELECT id,
				   name,
				   source,
				   role_id,
				   color_hex,
				   rank,
				   is_access_role,
				   is_public_default,
				   is_authenticated_default,
				   is_admin,
				   is_editor,
				   created_dt,
				   updated_dt
			FROM web_view.discord_roles
			WHERE id = $1
			LIMIT 1
		`,
		[roleId],
	);

	const row = result.rows[0] ?? null;
	return row ? mapRole(row) : null;
}

export async function createDiscordRoleAdmin(args: {
	actorDiscordId: string;
	name: string;
	source: DiscordRoleSourceCode;
	roleId: string | null;
	colorHex: string | null;
	rank: number;
	isAccessRole: boolean;
	fullEditorialAccess: boolean;
	isAdmin: boolean;
	isPublicDefault: boolean;
	isAuthenticatedDefault: boolean;
}): Promise<DiscordRoleAdminItem | null> {
	const result = await query<DiscordRoleViewRow>(
		`
			SELECT id,
				   name,
				   source,
				   role_id,
				   color_hex,
				   rank,
				   is_access_role,
				   is_public_default,
				   is_authenticated_default,
				   is_admin,
				   is_editor,
				   created_dt,
				   updated_dt
			FROM web_api.discord_role_create($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`,
		[
			args.actorDiscordId,
			args.name,
			args.source,
			args.roleId,
			args.colorHex,
			args.rank,
			args.isAccessRole,
			args.fullEditorialAccess,
			args.isAdmin,
			args.isPublicDefault,
			args.isAuthenticatedDefault,
		],
	);

	const row = result.rows[0] ?? null;
	return row ? mapRole(row) : null;
}

export async function updateDiscordRoleAdmin(args: {
	actorDiscordId: string;
	rolePkId: number;
	name: string;
	source: DiscordRoleSourceCode;
	roleId: string | null;
	colorHex: string | null;
	rank: number;
	isAccessRole: boolean;
	fullEditorialAccess: boolean;
	isAdmin: boolean;
	isPublicDefault: boolean;
	isAuthenticatedDefault: boolean;
}): Promise<DiscordRoleAdminItem | null> {
	const result = await query<DiscordRoleViewRow>(
		`
			SELECT id,
				   name,
				   source,
				   role_id,
				   color_hex,
				   rank,
				   is_access_role,
				   is_public_default,
				   is_authenticated_default,
				   is_admin,
				   is_editor,
				   created_dt,
				   updated_dt
			FROM web_api.discord_role_update($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		`,
		[
			args.actorDiscordId,
			args.rolePkId,
			args.name,
			args.source,
			args.roleId,
			args.colorHex,
			args.rank,
			args.isAccessRole,
			args.fullEditorialAccess,
			args.isAdmin,
			args.isPublicDefault,
			args.isAuthenticatedDefault,
		],
	);

	const row = result.rows[0] ?? null;
	return row ? mapRole(row) : null;
}

export async function deleteDiscordRoleAdmin(
	actorDiscordId: string,
	rolePkId: number,
): Promise<DiscordRoleAdminItem | null> {
	const result = await query<DiscordRoleViewRow>(
		`
			SELECT id,
				   name,
				   source,
				   role_id,
				   color_hex,
				   rank,
				   is_access_role,
				   is_public_default,
				   is_authenticated_default,
				   is_admin,
				   is_editor,
				   created_dt,
				   updated_dt
			FROM web_api.discord_role_delete($1, $2)
		`,
		[actorDiscordId, rolePkId],
	);

	const row = result.rows[0] ?? null;
	return row ? mapRole(row) : null;
}

export async function listDiscordUsersAdminPage(args: {
	search: string;
	page: number;
	pageSize: number;
	sortBy?: DiscordUserAdminSortBy;
	sortDir?: DiscordAdminSortDir;
}): Promise<DiscordUserAdminPage> {
	const search = args.search.trim();
	const offset = (args.page - 1) * args.pageSize;
	const orderBy = buildDiscordUserOrderBy(args.sortBy, args.sortDir);
	const searchValue = search.length > 0 ? `%${search}%` : "";
	const [countResult, itemsResult] = await Promise.all([
		query<CountRow>(
			`
				SELECT COUNT(*) AS total_docs
				FROM web_view.discord_users
				WHERE (
					$1 = ''
					OR discord_id ILIKE $2
					OR username ILIKE $2
					OR COALESCE(global_name, '') ILIKE $2
					OR COALESCE(notes, '') ILIKE $2
				)
			`,
			[search, searchValue],
		),
		query<DiscordUserListRow>(
			`
				SELECT discord_user_id,
					   discord_id,
					   username,
					   global_name,
					   is_member,
					   roles_synced_dt,
					   last_login_dt,
					   is_role_refresh_due,
					   notes,
					   updated_dt
				FROM web_view.discord_users
				WHERE (
					$1 = ''
					OR discord_id ILIKE $2
					OR username ILIKE $2
					OR COALESCE(global_name, '') ILIKE $2
					OR COALESCE(notes, '') ILIKE $2
				)
				${orderBy}
				LIMIT $3 OFFSET $4
			`,
			[search, searchValue, args.pageSize, offset],
		),
	]);
	const totalDocs = Number(countResult.rows[0]?.total_docs ?? 0);
	const totalPages = totalDocs > 0 ? Math.ceil(totalDocs / args.pageSize) : 1;

	return {
		rows: itemsResult.rows.map(mapUser),
		page: args.page,
		pageSize: args.pageSize,
		totalDocs,
		totalPages,
	};
}

export async function updateDiscordUserNotesAdmin(args: {
	actorDiscordId: string;
	discordUserId: number;
	notes: string | null;
}): Promise<DiscordUserAdminItem | null> {
	const result = await query<DiscordUserListRow>(
		`
			SELECT discord_user_id,
				   discord_id,
				   username,
				   global_name,
				   is_member,
				   roles_synced_dt,
				   last_login_dt,
				   is_role_refresh_due,
				   notes,
				   updated_dt
			FROM web_api.discord_user_update_notes($1, $2, $3)
		`,
		[args.actorDiscordId, args.discordUserId, args.notes],
	);

	const row = result.rows[0] ?? null;
	return row ? mapUser(row) : null;
}

export async function findDiscordUserAdminDetail(
	discordUserId: number,
): Promise<DiscordUserAdminDetail | null> {
	const [docResult, roleResult] = await Promise.all([
		query<DiscordUserDocRow>(
			`
				SELECT discord_user_id,
					   discord_id,
					   username,
					   global_name,
					   is_member,
					   joined_dt,
					   roles_synced_dt,
					   last_login_dt,
					   is_role_refresh_due,
					   notes
				FROM web_view.discord_users
				WHERE discord_user_id = $1
				LIMIT 1
			`,
			[discordUserId],
		),
		query<DiscordUserRoleRow>(
			`
				SELECT discord_role_id,
					   name
				FROM web_view.discord_user_cached_roles
				WHERE discord_user_id = $1
				ORDER BY rank DESC,
						 name ASC
			`,
			[discordUserId],
		),
	]);
	const doc = docResult.rows[0] ?? null;

	if (!doc) {
		return null;
	}

	return {
		id: String(doc.discord_user_id),
		discordId: doc.discord_id,
		username: doc.username,
		globalName: doc.global_name,
		isMember: doc.is_member,
		joinedDt: toIsoString(doc.joined_dt),
		rolesSyncedDt: toIsoString(doc.roles_synced_dt),
		lastLoginAt: toIsoString(doc.last_login_dt),
		isRoleRefreshDue: doc.is_role_refresh_due,
		notes: doc.notes ?? "",
		roles: roleResult.rows.map((row) => ({
			roleId: row.discord_role_id,
			name: row.name,
		})),
	};
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

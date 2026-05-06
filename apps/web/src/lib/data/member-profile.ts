//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/member-profile.ts                                                              ////
//// Language: TS                                                                                               ////
//// DB-first member profile and CSS theme style option helpers for signed-in users.                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";

export type MemberThemeStyleCode = "dark" | "light" | "vintage";

export type MemberThemeOption = {
	value: MemberThemeStyleCode;
	label: string;
	className: string;
};

type ProfileRow = {
	discord_user_id: string | number;
	auth_user_id: string | number;
	discord_id: string;
	username: string | null;
	global_name: string | null;
	avatar_hash: string | null;
	avatar_url: string | null;
	created_from_snowflake: Date | string | null;
	is_member: boolean;
	joined_dt: Date | string | null;
	last_login_dt: Date | string | null;
	is_role_refresh_due: boolean;
	discord_created_dt: Date | string;
	discord_updated_dt: Date | string;
	profile_id: string | number | null;
	game_username: string | null;
	alias: string | null;
	theme_style_code: string | null;
	theme_style_label: string | null;
	theme_style_class: string | null;
	profile_notes: string | null;
	profile_created_dt: Date | string | null;
	profile_updated_dt: Date | string | null;
};

export type ProfilePayload = {
	id: number;
	userUid: string | null;
	discordId: string;
	username: string | null;
	globalName: string | null;
	avatarHash: string | null;
	discriminator: string | null;
	createdFromSnowflake: string | null;
	isMember: boolean;
	roles: null;
	joinedAt: string | null;
	gameUsername: string | null;
	alias: string | null;
	entity: null;
	theme: {
		id: MemberThemeStyleCode;
		key: MemberThemeStyleCode;
		label: string;
		themeName: string;
		className: string;
		preview: null;
	};
	notes: string | null;
	validFrom: null;
	validTo: null;
	lastLoginAt: string | null;
	updatedAt: string | null;
	createdAt: string | null;
};

export type EditableProfilePayload = {
	gameUsername?: string | null;
	alias?: string | null;
	themeStyleCode?: MemberThemeStyleCode | null;
	notes?: string | null;
};

const MEMBER_THEME_OPTIONS: MemberThemeOption[] = [
	{
		value: "vintage",
		label: "Vintage",
		className: "cm-vintage",
	},
	{
		value: "dark",
		label: "Dark",
		className: "cm-dark",
	},
	{
		value: "light",
		label: "Light",
		className: "cm-light",
	},
];

export function isMemberThemeStyleCode(value: string): value is MemberThemeStyleCode {
	return value === "dark" || value === "light" || value === "vintage";
}

export function normalizeMemberThemeStyleCode(
	value: string | null | undefined,
): MemberThemeStyleCode {
	const normalized = value?.trim().toLowerCase() ?? "";
	return isMemberThemeStyleCode(normalized) ? normalized : "vintage";
}

export function getMemberThemeOption(
	value: string | null | undefined,
): MemberThemeOption {
	const code = normalizeMemberThemeStyleCode(value);
	return (
		MEMBER_THEME_OPTIONS.find((option) => option.value === code) ??
		MEMBER_THEME_OPTIONS[0]
	);
}

function dateToString(value: Date | string | null): string | null {
	if (value === null) {
		return null;
	}

	return value instanceof Date ? value.toISOString() : value;
}

function idToNumber(value: string | number): number {
	const parsed = typeof value === "number" ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

function mapProfile(row: ProfileRow): ProfilePayload {
	const themeOption = getMemberThemeOption(row.theme_style_code);
	const themeLabel = row.theme_style_label ?? themeOption.label;
	const themeClassName = row.theme_style_class ?? themeOption.className;

	return {
		id: idToNumber(row.discord_user_id),
		userUid: String(row.auth_user_id),
		discordId: row.discord_id,
		username: row.username,
		globalName: row.global_name,
		avatarHash: row.avatar_hash,
		discriminator: null,
		createdFromSnowflake: dateToString(row.created_from_snowflake),
		isMember: row.is_member,
		roles: null,
		joinedAt: dateToString(row.joined_dt),
		gameUsername: row.game_username,
		alias: row.alias,
		entity: null,
		theme: {
			id: themeOption.value,
			key: themeOption.value,
			label: themeLabel,
			themeName: themeLabel,
			className: themeClassName,
			preview: null,
		},
		notes: row.profile_notes,
		validFrom: null,
		validTo: null,
		lastLoginAt: dateToString(row.last_login_dt),
		updatedAt: dateToString(row.profile_updated_dt ?? row.discord_updated_dt),
		createdAt: dateToString(row.profile_created_dt ?? row.discord_created_dt),
	};
}

export async function readOwnProfile(
	actorDiscordId: string,
): Promise<ProfilePayload | null> {
	const result = await query<ProfileRow>(
		`
			SELECT du.discord_user_id,
				   du.auth_user_id,
				   du.discord_id,
				   du.username,
				   du.global_name,
				   du.avatar_hash,
				   du.avatar_url,
				   du.created_from_snowflake,
				   du.is_member,
				   du.joined_dt,
				   du.last_login_dt,
				   du.is_role_refresh_due,
				   du.created_dt AS discord_created_dt,
				   du.updated_dt AS discord_updated_dt,
				   mp.member_profile_id AS profile_id,
				   mp.game_username,
				   mp.alias,
				   mp.theme_style_code,
				   mp.theme_style_label,
				   mp.theme_style_class,
				   mp.notes AS profile_notes,
				   mp.created_dt AS profile_created_dt,
				   mp.updated_dt AS profile_updated_dt
			FROM web_view.discord_users du
			LEFT JOIN web_view.web_member_profiles mp ON mp.auth_user_id = du.auth_user_id
			WHERE du.discord_id = $1
			LIMIT 1
		`,
		[actorDiscordId],
	);

	const row = result.rows[0] ?? null;
	return row ? mapProfile(row) : null;
}

export async function updateOwnProfile(args: {
	actorDiscordId: string;
	updates: EditableProfilePayload;
}): Promise<void> {
	await query(
		`
			SELECT web_api.web_member_profile_upsert_self(
				$1,
				$2,
				$3,
				$4::text,
				$5
			)
		`,
		[
			args.actorDiscordId,
			args.updates.gameUsername ?? null,
			args.updates.alias ?? null,
			normalizeMemberThemeStyleCode(args.updates.themeStyleCode ?? null),
			args.updates.notes ?? null,
		],
	);
}

export async function listMemberThemeOptions(
	search: string,
): Promise<MemberThemeOption[]> {
	const normalizedSearch = search.trim().toLowerCase();

	if (!normalizedSearch) {
		return MEMBER_THEME_OPTIONS;
	}

	return MEMBER_THEME_OPTIONS.filter((option) => {
		const codeMatch = option.value.includes(normalizedSearch);
		const labelMatch = option.label.toLowerCase().includes(normalizedSearch);
		return codeMatch || labelMatch;
	});
}

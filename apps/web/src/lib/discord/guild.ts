//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/discord/guild.ts                                                                  ////
//// Language: TS                                                                                              ////
//// Discord guild API helpers for roles and members.                                                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { getOptionalEnv, getRequiredEnv } from "@/lib/server/env";

const DISCORD_API = "https://discord.com/api/v10";

export type APIRole = {
	id: string;
	name: string;
	position: number;
	color: number;
	hoist: boolean;
	managed: boolean;
	mentionable: boolean;
	permissions: string;
	icon?: string | null;
	unicode_emoji?: string | null;
	tags?: Record<string, unknown>;
	flags?: number;
};

export type APIGuildMember = {
	roles: string[];
	joined_at: string;
	user?: {
		id: string;
		username: string;
		global_name?: string | null;
		avatar?: string | null;
	};
	nick?: string | null;
	avatar?: string | null;
};

async function discordGet<T>(path: string, authorization: string): Promise<T> {
	const response = await fetch(`${DISCORD_API}${path}`, {
		headers: { Authorization: authorization },
		cache: "no-store",
	});

	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw new Error(`Discord GET ${path} -> ${response.status} ${text}`);
	}

	return (await response.json()) as T;
}

async function discordBotGet<T>(path: string): Promise<T> {
	const token = getRequiredEnv("DISCORD_BOT_TOKEN");
	return discordGet<T>(path, `Bot ${token}`);
}

async function discordBearerGet<T>(
	path: string,
	accessToken: string,
): Promise<T> {
	return discordGet<T>(path, `Bearer ${accessToken}`);
}

export async function getGuildRoles(guildId: string): Promise<APIRole[]> {
	return discordBotGet<APIRole[]>(`/guilds/${guildId}/roles`);
}

export async function getGuildMember(
	guildId: string,
	userId: string,
): Promise<APIGuildMember> {
	return discordBotGet<APIGuildMember>(`/guilds/${guildId}/members/${userId}`);
}

export async function getCurrentUserGuildMember(
	guildId: string,
	accessToken: string,
): Promise<APIGuildMember> {
	return discordBearerGet<APIGuildMember>(
		`/users/@me/guilds/${guildId}/member`,
		accessToken,
	);
}

export async function getMemberRoleIds(
	guildId: string,
	userId: string,
): Promise<string[]> {
	try {
		const member = await getGuildMember(guildId, userId);
		return member.roles ?? [];
	} catch {
		return [];
	}
}

export async function fetchMemberRoleIds(userId: string): Promise<string[]> {
	const guildId = getOptionalEnv("DISCORD_GUILD_ID");
	if (!guildId) {
		return [];
	}
	return getMemberRoleIds(guildId, userId);
}

export function colorIntToHex(
	value: number | null | undefined,
): string | undefined {
	if (!value || value <= 0) {
		return undefined;
	}
	return `#${Number(value).toString(16).padStart(6, "0")}`;
}

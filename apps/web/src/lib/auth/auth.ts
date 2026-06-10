//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/auth/auth.ts                                                                       ////
//// Language: TS                                                                                               ////
//// NextAuth Discord login sync backed by DB-first auth and role surfaces.                                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import {
	getServerSession,
	type Account as NextAuthAccount,
	type NextAuthOptions,
	type Session,
	type User as NextAuthUser,
} from "next-auth";
import type { JWT } from "next-auth/jwt";
import DiscordProvider, {
	type DiscordProfile,
} from "next-auth/providers/discord";

import { buildAuthAdapter } from "@/lib/auth/adapter";
import { query } from "@/lib/data/pg";
import {
	getOptionalEnv,
	getRequiredBuildSafeEnv,
	getRequiredBuildSafeSecretEnv,
} from "@/lib/server/env";
import {
	getCurrentUserGuildMember,
	getGuildMember,
	getGuildRoles,
	type APIGuildMember,
	type APIRole,
} from "@/lib/discord/guild";

type SessionUserShape = {
	id?: string;
	name?: string | null;
	email?: string | null;
	image?: string | null;
	discordId?: string | null;
};

type JwtWithDiscordId = JWT & {
	discordId?: string | null;
};

type DiscordSyncResultRow = {
	discord_user_id: string | number;
	auth_user_id: string | number;
	discord_id: string;
	username: string;
	global_name: string | null;
	avatar_url: string | null;
	is_member: boolean;
	roles_synced_dt: Date | string | null;
	last_login_dt: Date | string | null;
	is_role_refresh_due: boolean;
	is_authenticated: boolean;
	is_admin: boolean;
	is_editor: boolean;
	max_rank: number;
};

type DiscordUserViewRow = {
	discord_user_id: string | number;
	auth_user_id: string | number;
	discord_id: string;
	username: string;
	global_name: string | null;
	avatar_hash: string | null;
	avatar_url: string | null;
	created_from_snowflake: Date | string | null;
	is_member: boolean;
	joined_dt: Date | string | null;
	notes: string | null;
	roles_synced_dt: Date | string | null;
	last_login_dt: Date | string | null;
	is_role_refresh_due: boolean;
	created_dt: Date | string;
	updated_dt: Date | string;
};

type AuthUserIdentityRow = {
	auth_user_id: string | number;
	discord_id: string | null;
	is_disabled: boolean;
};

type DiscordRoleSyncPayload = {
	role_id: string;
	role_name: string;
	role_position: number | null;
	is_managed: boolean;
	color_integer: number | null;
};

type DiscordSyncFetchResult = {
	guildMember: APIGuildMember | null;
	guildRoles: APIRole[];
	memberFetchOk: boolean;
	rolesFetchOk: boolean;
};

type DiscordSyncMode = "login" | "verify";

type DiscordSyncRequest = {
	authUserId: string;
	discordUserId: string;
	username: string;
	globalName: string | null;
	avatarHash: string | null;
	avatarUrl: string | null;
	createdFromSnowflake: Date | null;
	isMember: boolean;
	joinedDt: Date | null;
	roles: DiscordRoleSyncPayload[];
};

function avatarUrlFromProfile(profile: DiscordProfile): string | null {
	if (!profile.avatar) {
		return null;
	}

	return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
}

function avatarUrlFromMember(
	member: APIGuildMember | null,
	discordUserId: string,
): string | null {
	const avatarHash = member?.user?.avatar ?? null;

	if (!avatarHash) {
		return null;
	}

	return `https://cdn.discordapp.com/avatars/${discordUserId}/${avatarHash}.png`;
}

function snowflakeToTimestamp(snowflake: string): Date | null {
	try {
		const snowflakeValue = BigInt(snowflake);
		const discordEpochMs = BigInt("1420070400000");
		const createdAtMs = (snowflakeValue >> BigInt(22)) + discordEpochMs;
		return new Date(Number(createdAtMs));
	} catch {
		return null;
	}
}

function isDiscordNotFoundError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	return error.message.includes(" -> 404 ");
}

function buildRoleSyncPayload(
	guildMember: APIGuildMember | null,
	guildRoles: readonly APIRole[],
): DiscordRoleSyncPayload[] {
	if (
		!guildMember ||
		!Array.isArray(guildMember.roles) ||
		guildMember.roles.length === 0
	) {
		return [];
	}

	const roleMap = new Map<string, APIRole>();

	for (const role of guildRoles) {
		roleMap.set(role.id, role);
	}

	const uniqueRoleIds = [...new Set(guildMember.roles)];

	return uniqueRoleIds.map((roleId) => {
		const role = roleMap.get(roleId);

		return {
			role_id: roleId,
			role_name: role?.name ?? roleId,
			role_position: typeof role?.position === "number" ? role.position : null,
			is_managed: role?.managed === true,
			color_integer: typeof role?.color === "number" ? role.color : null,
		};
	});
}

async function fetchDiscordSyncData(
	guildId: string | null | undefined,
	discordUserId: string,
	discordAccessToken?: string | null,
): Promise<DiscordSyncFetchResult> {
	if (!guildId) {
		return {
			guildMember: null,
			guildRoles: [],
			memberFetchOk: false,
			rolesFetchOk: false,
		};
	}

	let guildMember: APIGuildMember | null = null;
	let guildRoles: APIRole[] = [];
	let memberFetchOk = false;
	let rolesFetchOk = false;

	if (discordAccessToken) {
		try {
			guildMember = await getCurrentUserGuildMember(guildId, discordAccessToken);
			memberFetchOk = true;
		} catch (error: unknown) {
			if (isDiscordNotFoundError(error)) {
				memberFetchOk = true;
				guildMember = null;
			} else {
				console.warn(
					"[auth] Discord OAuth member fetch failed during role sync; falling back to bot lookup:",
					error,
				);
			}
		}
	}

	if (!memberFetchOk && getOptionalEnv("DISCORD_BOT_TOKEN")) {
		try {
			guildMember = await getGuildMember(guildId, discordUserId);
			memberFetchOk = true;
		} catch (error: unknown) {
			if (isDiscordNotFoundError(error)) {
				memberFetchOk = true;
				guildMember = null;
			} else {
				console.error(
					"[auth] Discord bot member fetch failed during role sync:",
					error,
				);
			}
		}
	}

	if (getOptionalEnv("DISCORD_BOT_TOKEN")) {
		try {
			guildRoles = await getGuildRoles(guildId);
			rolesFetchOk = true;
		} catch (error: unknown) {
			console.error(
				"[auth] Discord guild roles fetch failed during role sync:",
				error,
			);
		}
	}

	return {
		guildMember,
		guildRoles,
		memberFetchOk,
		rolesFetchOk,
	};
}

async function getDiscordUserViewByDiscordId(
	discordUserId: string,
): Promise<DiscordUserViewRow | null> {
	const result = await query<DiscordUserViewRow>(
		`
			SELECT
				discord_user_id,
				auth_user_id,
				discord_id,
				username,
				global_name,
				avatar_hash,
				avatar_url,
				created_from_snowflake,
				is_member,
				joined_dt,
				notes,
				roles_synced_dt,
				last_login_dt,
				is_role_refresh_due,
				created_dt,
				updated_dt
			FROM web_view.discord_users
			WHERE discord_id = $1
			LIMIT 1
		`,
		[discordUserId],
	);

	return result.rows[0] ?? null;
}

function normalizeSessionIdentifier(
	value: string | null | undefined,
): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : null;
}

function isIntegerText(value: string): boolean {
	return /^\d+$/.test(value);
}

function isLikelyDiscordSnowflake(value: string): boolean {
	return /^\d{17,20}$/.test(value);
}

async function findAuthUserIdentityByAuthUserId(
	authUserId: string,
): Promise<AuthUserIdentityRow | null> {
	if (!isIntegerText(authUserId)) {
		return null;
	}

	const result = await query<AuthUserIdentityRow>(
		`
			SELECT
				auth_user_id,
				discord_id,
				is_disabled
			FROM web_view.auth_users
			WHERE auth_user_id = $1::bigint
			LIMIT 1
		`,
		[authUserId],
	);

	const row = result.rows[0] ?? null;
	return row && !row.is_disabled ? row : null;
}

async function findAuthUserIdentityByDiscordId(
	discordUserId: string,
): Promise<AuthUserIdentityRow | null> {
	const result = await query<AuthUserIdentityRow>(
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

	const row = result.rows[0] ?? null;
	return row && !row.is_disabled ? row : null;
}

type CanonicalSessionIdentity = {
	authUserId: string | null;
	discordUserId: string | null;
};

async function resolveCanonicalSessionIdentity(params: {
	authUserId: string | null;
	discordUserId: string | null;
}): Promise<CanonicalSessionIdentity> {
	const authUserId = normalizeSessionIdentifier(params.authUserId);
	const discordUserId = normalizeSessionIdentifier(params.discordUserId);

	if (discordUserId) {
		const row = await findAuthUserIdentityByDiscordId(discordUserId);

		if (row?.discord_id) {
			return {
				authUserId: String(row.auth_user_id),
				discordUserId: row.discord_id,
			};
		}
	}

	if (authUserId) {
		const row = await findAuthUserIdentityByAuthUserId(authUserId);

		if (row?.discord_id) {
			return {
				authUserId: String(row.auth_user_id),
				discordUserId: row.discord_id,
			};
		}

		if (isLikelyDiscordSnowflake(authUserId)) {
			const discordRow = await findAuthUserIdentityByDiscordId(authUserId);

			if (discordRow?.discord_id) {
				return {
					authUserId: String(discordRow.auth_user_id),
					discordUserId: discordRow.discord_id,
				};
			}
		}
	}

	return {
		authUserId,
		discordUserId,
	};
}

function shouldRefreshJwtIdentity(token: JwtWithDiscordId): boolean {
	const authUserId = normalizeSessionIdentifier(
		typeof token.sub === "string" ? token.sub : null,
	);
	const discordUserId = normalizeSessionIdentifier(token.discordId ?? null);

	if (!authUserId && !discordUserId) {
		return false;
	}

	if (!authUserId || !discordUserId) {
		return true;
	}

	return authUserId === discordUserId || isLikelyDiscordSnowflake(authUserId);
}

async function runDiscordSync(
	mode: DiscordSyncMode,
	request: DiscordSyncRequest,
): Promise<DiscordSyncResultRow | null> {
	const sql =
		mode === "login"
			? `
				SELECT
					discord_user_id,
					auth_user_id,
					discord_id,
					username,
					global_name,
					avatar_url,
					is_member,
					roles_synced_dt,
					last_login_dt,
					is_role_refresh_due,
					is_authenticated,
					is_admin,
					is_editor,
					max_rank
				FROM web_api.auth_sync_discord_login(
					$1::bigint,
					$2,
					$3,
					$4,
					$5,
					$6,
					$7,
					$8,
					$9,
					$10::jsonb,
					$11
				)
			`
			: `
				SELECT
					discord_user_id,
					auth_user_id,
					discord_id,
					username,
					global_name,
					avatar_url,
					is_member,
					roles_synced_dt,
					last_login_dt,
					is_role_refresh_due,
					is_authenticated,
					is_admin,
					is_editor,
					max_rank
				FROM web_api.auth_sync_discord_verify(
					$1::bigint,
					$2,
					$3,
					$4,
					$5,
					$6,
					$7,
					$8,
					$9,
					$10::jsonb,
					$11
				)
			`;

	const result = await query<DiscordSyncResultRow>(sql, [
		request.authUserId,
		request.discordUserId,
		request.username,
		request.globalName,
		request.avatarHash,
		request.avatarUrl,
		request.createdFromSnowflake,
		request.isMember,
		request.joinedDt,
		JSON.stringify(request.roles),
		mode,
	]);

	return result.rows[0] ?? null;
}

function buildSyncRequest(params: {
	authUserId: string;
	discordUserId: string;
	guildMember: APIGuildMember | null;
	guildRoles: readonly APIRole[];
	usernameFallback?: string | null;
	globalNameFallback?: string | null;
	avatarHashFallback?: string | null;
	avatarUrlFallback?: string | null;
	joinedDtFallback?: Date | null;
}): DiscordSyncRequest {
	const username =
		params.guildMember?.user?.username ??
		params.usernameFallback ??
		params.discordUserId;
	const globalName =
		params.guildMember?.user?.global_name ?? params.globalNameFallback ?? null;
	const avatarHash =
		params.guildMember?.user?.avatar ?? params.avatarHashFallback ?? null;
	const avatarUrl =
		avatarUrlFromMember(params.guildMember, params.discordUserId) ??
		params.avatarUrlFallback ??
		null;
	const joinedDt = params.guildMember?.joined_at
		? new Date(params.guildMember.joined_at)
		: (params.joinedDtFallback ?? null);

	return {
		authUserId: params.authUserId,
		discordUserId: params.discordUserId,
		username,
		globalName,
		avatarHash,
		avatarUrl,
		createdFromSnowflake: snowflakeToTimestamp(params.discordUserId),
		isMember: params.guildMember !== null,
		joinedDt,
		roles: buildRoleSyncPayload(params.guildMember, params.guildRoles),
	};
}

export async function syncDiscordUserOnLogin(params: {
	authUserId: string;
	discordUserId: string;
	discordAccessToken?: string | null;
	usernameFallback?: string | null;
	globalNameFallback?: string | null;
	imageFallback?: string | null;
}): Promise<DiscordSyncResultRow | null> {
	const guildId = getOptionalEnv("DISCORD_GUILD_ID");
	const syncData = await fetchDiscordSyncData(
		guildId,
		params.discordUserId,
		params.discordAccessToken,
	);

	if (!syncData.memberFetchOk || !syncData.rolesFetchOk) {
		console.warn(
			`[auth] Blocking Discord login sync for ${params.discordUserId} because guild verification is unavailable.`,
		);
		return null;
	}

	const request = buildSyncRequest({
		authUserId: params.authUserId,
		discordUserId: params.discordUserId,
		guildMember: syncData.guildMember,
		guildRoles: syncData.guildRoles,
		usernameFallback: params.usernameFallback,
		globalNameFallback: params.globalNameFallback,
		avatarUrlFallback: params.imageFallback,
	});

	return runDiscordSync("login", request);
}

export async function verifyDiscordRolesIfDue(params: {
	authUserId: string;
	discordUserId: string;
}): Promise<boolean> {
	const current = await getDiscordUserViewByDiscordId(params.discordUserId);

	if (current && current.is_role_refresh_due === false) {
		return true;
	}

	const guildId = getOptionalEnv("DISCORD_GUILD_ID");
	const syncData = await fetchDiscordSyncData(guildId, params.discordUserId);

	if (!syncData.memberFetchOk || !syncData.rolesFetchOk) {
		console.warn(
			`[auth] Skipping Discord role verify for ${params.discordUserId} because guild verification is unavailable.`,
		);
		return false;
	}

	const request = buildSyncRequest({
		authUserId: params.authUserId,
		discordUserId: params.discordUserId,
		guildMember: syncData.guildMember,
		guildRoles: syncData.guildRoles,
		usernameFallback: current?.username ?? params.discordUserId,
		globalNameFallback: current?.global_name ?? null,
		avatarHashFallback: current?.avatar_hash ?? null,
		avatarUrlFallback: current?.avatar_url ?? null,
		joinedDtFallback:
			current?.joined_dt instanceof Date
				? current.joined_dt
				: typeof current?.joined_dt === "string"
					? new Date(current.joined_dt)
					: null,
	});

	const result = await runDiscordSync("verify", request);
	return result !== null;
}

async function syncDiscordUserForSignIn(params: {
	authUserId: string;
	discordUserId: string;
	discordAccessToken?: string | null;
	usernameFallback?: string | null;
	globalNameFallback?: string | null;
	imageFallback?: string | null;
}): Promise<boolean> {
	try {
		const synced = await syncDiscordUserOnLogin(params);

		if (!synced) {
			console.warn(
				`[auth] Blocking Discord sign-in for ${params.discordUserId} because guild verification is unavailable.`,
			);
			return false;
		}

		return true;
	} catch (error: unknown) {
		console.error(
			`[auth] Blocking Discord sign-in for ${params.discordUserId} because guild sync failed:`,
			error,
		);
		return false;
	}
}

function getSessionDiscordId(params: {
	authUserId: string | null;
	discordUserId: string | null;
}): string | null {
	if (!params.authUserId || !params.discordUserId) {
		return null;
	}

	return params.discordUserId;
}

export function buildAuthOptions(): NextAuthOptions {
	const isProduction = process.env.NODE_ENV === "production";

	return {
		adapter: buildAuthAdapter(),
		session: {
			strategy: "jwt",
			maxAge: 7 * 24 * 60 * 60,
			updateAge: 24 * 60 * 60,
		},
		secret: getRequiredBuildSafeSecretEnv("NEXTAUTH_SECRET", 32),
		useSecureCookies: isProduction,
		cookies: {
			sessionToken: {
				name: isProduction
					? "__Secure-next-auth.session-token"
					: "next-auth.session-token",
				options: {
					httpOnly: true,
					sameSite: "lax",
					path: "/",
					secure: isProduction,
				},
			},
		},
		pages: {
			signIn: "/login",
		},
		providers: [
			DiscordProvider({
				clientId: getRequiredBuildSafeEnv("DISCORD_CLIENT_ID"),
				clientSecret: getRequiredBuildSafeSecretEnv("DISCORD_CLIENT_SECRET", 16),
				authorization: {
					params: {
						scope: "identify guilds.members.read",
					},
				},
				profile(profile: DiscordProfile) {
					const displayName = profile.global_name ?? profile.username ?? null;

					return {
						id: profile.id,
						name: displayName,
						email: null,
						image: avatarUrlFromProfile(profile),
					};
				},
			}),
		],
		callbacks: {
			async signIn({
				user,
				account,
			}: {
				user: NextAuthUser;
				account?: NextAuthAccount | null;
			}) {
				if (account?.provider !== "discord" || !account.providerAccountId) {
					console.warn(
						"[auth] Blocking sign-in because the Discord account context is incomplete.",
					);
					return false;
				}

				if (!user.id) {
					console.warn(
						"[auth] Blocking Discord sign-in because the internal auth user context is missing.",
					);
					return false;
				}

				return syncDiscordUserForSignIn({
					authUserId: user.id,
					discordUserId: account.providerAccountId,
					discordAccessToken:
						typeof account.access_token === "string" ? account.access_token : null,
					usernameFallback: user.name ?? null,
					globalNameFallback: user.name ?? null,
					imageFallback: user.image ?? null,
				});
			},
			async jwt({
				token,
				user,
				account,
			}: {
				token: JWT;
				user?: NextAuthUser;
				account?: NextAuthAccount | null;
			}) {
				const mutableToken = token as JwtWithDiscordId;

				if (account?.provider === "discord" && account.providerAccountId) {
					if (!user?.id) {
						throw new Error(
							"Discord token creation blocked because the internal auth user context is missing.",
						);
					}

					mutableToken.sub = user.id;
					mutableToken.discordId = account.providerAccountId;

					const canonicalIdentity = await resolveCanonicalSessionIdentity({
						authUserId: user.id,
						discordUserId: account.providerAccountId,
					});

					if (canonicalIdentity.authUserId) {
						mutableToken.sub = canonicalIdentity.authUserId;
					}

					if (canonicalIdentity.discordUserId) {
						mutableToken.discordId = canonicalIdentity.discordUserId;
					}

					return mutableToken;
				}

				if (user?.id) {
					mutableToken.sub = user.id;
				}

				if (shouldRefreshJwtIdentity(mutableToken)) {
					const canonicalIdentity = await resolveCanonicalSessionIdentity({
						authUserId:
							typeof mutableToken.sub === "string" ? mutableToken.sub : null,
						discordUserId: mutableToken.discordId ?? null,
					});

					if (canonicalIdentity.authUserId) {
						mutableToken.sub = canonicalIdentity.authUserId;
					}

					if (canonicalIdentity.discordUserId) {
						mutableToken.discordId = canonicalIdentity.discordUserId;
					}
				}

				return mutableToken;
			},
			async session({ session, token }: { session: Session; token: JWT }) {
				const mutableToken = token as JwtWithDiscordId;
				const mutableSessionUser = (session.user ?? {}) as SessionUserShape;
				let authUserId =
					typeof mutableToken.sub === "string" ? mutableToken.sub : null;
				let discordUserId =
					typeof mutableToken.discordId === "string" ? mutableToken.discordId : null;

				if (!authUserId || !discordUserId || authUserId === discordUserId) {
					const canonicalIdentity = await resolveCanonicalSessionIdentity({
						authUserId,
						discordUserId,
					});

					authUserId = canonicalIdentity.authUserId ?? authUserId;
					discordUserId = canonicalIdentity.discordUserId ?? discordUserId;
				}

				mutableSessionUser.id = authUserId ?? undefined;
				mutableSessionUser.discordId = getSessionDiscordId({
					authUserId,
					discordUserId,
				});

				session.user = mutableSessionUser;
				return session;
			},
		},
	};
}

export async function getAuthSession(): Promise<Session | null> {
	return getServerSession(buildAuthOptions());
}

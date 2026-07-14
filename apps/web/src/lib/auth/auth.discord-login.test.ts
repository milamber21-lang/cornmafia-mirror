//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/auth/auth.discord-login.test.ts                                                     ////
//// Language: TS                                                                                                ////
//// Verifies first-login Discord membership and role synchronization before a session is accepted.             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { APIGuildMember, APIRole } from "@/lib/discord/guild";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	buildAuthAdapter: vi.fn(),
	getCurrentUserGuildMember: vi.fn(),
	getGuildMember: vi.fn(),
	getGuildRoles: vi.fn(),
	getOptionalEnv: vi.fn(),
	getRequiredBuildSafeEnv: vi.fn(),
	getRequiredBuildSafeSecretEnv: vi.fn(),
	getServerSession: vi.fn(),
	query: vi.fn(),
}));

vi.mock("next-auth", () => ({
	getServerSession: mocks.getServerSession,
}));

vi.mock("next-auth/providers/discord", () => ({
	default: vi.fn(() => ({ id: "discord" })),
}));

vi.mock("@/lib/auth/adapter", () => ({
	buildAuthAdapter: mocks.buildAuthAdapter,
}));

vi.mock("@/lib/data/pg", () => ({
	query: mocks.query,
}));

vi.mock("@/lib/discord/guild", () => ({
	getCurrentUserGuildMember: mocks.getCurrentUserGuildMember,
	getGuildMember: mocks.getGuildMember,
	getGuildRoles: mocks.getGuildRoles,
}));

vi.mock("@/lib/server/env", () => ({
	getOptionalEnv: mocks.getOptionalEnv,
	getRequiredBuildSafeEnv: mocks.getRequiredBuildSafeEnv,
	getRequiredBuildSafeSecretEnv: mocks.getRequiredBuildSafeSecretEnv,
}));

import { buildAuthOptions, syncDiscordUserOnLogin } from "@/lib/auth/auth";

const AUTH_USER_ID = "1001";
const DISCORD_USER_ID = "123456789012345678";
const GUILD_ID = "987654321098765432";

function guildMember(roleIds: string[]): APIGuildMember {
	return {
		roles: roleIds,
		joined_at: "2026-07-01T12:00:00.000Z",
		user: {
			id: DISCORD_USER_ID,
			username: "corn_member",
			global_name: "Corn Member",
			avatar: "avatar-hash",
		},
	};
}

function guildRole(id: string, name: string): APIRole {
	return {
		id,
		name,
		position: 10,
		color: 0x00ff00,
		hoist: false,
		managed: false,
		mentionable: false,
		permissions: "0",
	};
}

function syncResultRow() {
	return {
		discord_user_id: "2001",
		auth_user_id: AUTH_USER_ID,
		discord_id: DISCORD_USER_ID,
		username: "corn_member",
		global_name: "Corn Member",
		avatar_url: null,
		is_member: true,
		roles_synced_dt: "2026-07-12T12:00:00.000Z",
		last_login_dt: "2026-07-12T12:00:00.000Z",
		is_role_refresh_due: false,
		is_authenticated: true,
		is_admin: false,
		is_editor: false,
		max_rank: 10,
	};
}

function configureEnvironment(): void {
	mocks.getOptionalEnv.mockImplementation((name: string) => {
		if (name === "DISCORD_GUILD_ID") {
			return GUILD_ID;
		}
		if (name === "DISCORD_BOT_TOKEN") {
			return "bot-token-for-tests";
		}
		return null;
	});
	mocks.getRequiredBuildSafeEnv.mockReturnValue("build-safe-value");
	mocks.getRequiredBuildSafeSecretEnv.mockReturnValue(
		"build-safe-secret-value-with-enough-length",
	);
	mocks.buildAuthAdapter.mockReturnValue({});
}

function configureSuccessfulSync(): void {
	mocks.query.mockResolvedValue({
		rows: [syncResultRow()],
		rowCount: 1,
		command: "SELECT",
		oid: 0,
		fields: [],
	});
}

beforeEach(() => {
	vi.spyOn(console, "warn").mockImplementation(() => undefined);
	vi.spyOn(console, "error").mockImplementation(() => undefined);

	for (const mock of Object.values(mocks)) {
		mock.mockReset();
	}
	configureEnvironment();
	configureSuccessfulSync();
});

describe("syncDiscordUserOnLogin", () => {
	it("uses the OAuth member role result when it is complete", async () => {
		const member = guildMember(["role-member"]);
		mocks.getCurrentUserGuildMember.mockResolvedValue(member);
		mocks.getGuildRoles.mockResolvedValue([guildRole("role-member", "Member")]);

		await expect(
			syncDiscordUserOnLogin({
				authUserId: AUTH_USER_ID,
				discordUserId: DISCORD_USER_ID,
				discordAccessToken: "oauth-token",
			}),
		).resolves.toMatchObject({ discord_id: DISCORD_USER_ID });

		expect(mocks.getGuildMember).not.toHaveBeenCalled();
		expect(mocks.query).toHaveBeenCalledTimes(1);
		const params = mocks.query.mock.calls[0]?.[1] as
			| readonly unknown[]
			| undefined;
		expect(params?.[9]).toBe(
			JSON.stringify([
				{
					role_id: "role-member",
					role_name: "Member",
					role_position: 10,
					is_managed: false,
					color_integer: 0x00ff00,
				},
			]),
		);
	});

	it("verifies a suspicious empty OAuth role result through the bot member endpoint", async () => {
		mocks.getCurrentUserGuildMember.mockResolvedValue(guildMember([]));
		mocks.getGuildMember.mockResolvedValue(guildMember(["role-member"]));
		mocks.getGuildRoles.mockResolvedValue([guildRole("role-member", "Member")]);

		await expect(
			syncDiscordUserOnLogin({
				authUserId: AUTH_USER_ID,
				discordUserId: DISCORD_USER_ID,
				discordAccessToken: "oauth-token",
			}),
		).resolves.toMatchObject({ discord_id: DISCORD_USER_ID });

		expect(mocks.getGuildMember).toHaveBeenCalledWith(GUILD_ID, DISCORD_USER_ID);
		const params = mocks.query.mock.calls[0]?.[1] as
			| readonly unknown[]
			| undefined;
		expect(params?.[9]).toContain('"role_id":"role-member"');
	});

	it("accepts a bot-verified guild member with no custom roles", async () => {
		mocks.getCurrentUserGuildMember.mockResolvedValue(guildMember([]));
		mocks.getGuildMember.mockResolvedValue(guildMember([]));
		mocks.getGuildRoles.mockResolvedValue([]);

		await expect(
			syncDiscordUserOnLogin({
				authUserId: AUTH_USER_ID,
				discordUserId: DISCORD_USER_ID,
				discordAccessToken: "oauth-token",
			}),
		).resolves.toMatchObject({ discord_id: DISCORD_USER_ID });

		expect(mocks.getGuildMember).toHaveBeenCalledWith(GUILD_ID, DISCORD_USER_ID);
		const params = mocks.query.mock.calls[0]?.[1] as
			| readonly unknown[]
			| undefined;
		expect(params?.[9]).toBe("[]");
	});

	it("blocks a suspicious empty OAuth role result when bot verification is unavailable", async () => {
		mocks.getOptionalEnv.mockImplementation((name: string) =>
			name === "DISCORD_GUILD_ID" ? GUILD_ID : null,
		);
		mocks.getCurrentUserGuildMember.mockResolvedValue(guildMember([]));

		await expect(
			syncDiscordUserOnLogin({
				authUserId: AUTH_USER_ID,
				discordUserId: DISCORD_USER_ID,
				discordAccessToken: "oauth-token",
			}),
		).resolves.toBeNull();

		expect(mocks.getGuildMember).not.toHaveBeenCalled();
		expect(mocks.getGuildRoles).not.toHaveBeenCalled();
		expect(mocks.query).not.toHaveBeenCalled();
	});

	it("blocks login when guild verification is unavailable", async () => {
		mocks.getCurrentUserGuildMember.mockRejectedValue(
			new Error("Discord OAuth unavailable"),
		);
		mocks.getGuildMember.mockRejectedValue(new Error("Discord bot unavailable"));
		mocks.getGuildRoles.mockRejectedValue(new Error("Discord roles unavailable"));

		await expect(
			syncDiscordUserOnLogin({
				authUserId: AUTH_USER_ID,
				discordUserId: DISCORD_USER_ID,
				discordAccessToken: "oauth-token",
			}),
		).resolves.toBeNull();
		expect(mocks.query).not.toHaveBeenCalled();
	});
});

describe("Auth.js signIn callback", () => {
	it("does not accept the session until the database role sync completes", async () => {
		mocks.getCurrentUserGuildMember.mockResolvedValue(
			guildMember(["role-member"]),
		);
		mocks.getGuildRoles.mockResolvedValue([guildRole("role-member", "Member")]);

		const deferredSync: {
			resolve: ((value: ReturnType<typeof syncResultRow>) => void) | null;
		} = { resolve: null };
		mocks.query.mockReturnValue(
			new Promise((resolve) => {
				deferredSync.resolve = (row) => {
					resolve({
						rows: [row],
						rowCount: 1,
						command: "SELECT",
						oid: 0,
						fields: [],
					});
				};
			}),
		);

		const options = buildAuthOptions();
		const signIn = options.callbacks?.signIn;
		expect(signIn).toBeTypeOf("function");
		if (!signIn) {
			throw new Error("Expected Auth.js signIn callback.");
		}

		let settled = false;
		const signInPromise = Promise.resolve(
			signIn({
				user: {
					id: AUTH_USER_ID,
					name: "Corn Member",
					email: null,
					image: null,
				},
				account: {
					provider: "discord",
					type: "oauth",
					providerAccountId: DISCORD_USER_ID,
					access_token: "oauth-token",
				},
				profile: undefined,
				email: undefined,
				credentials: undefined,
			}),
		).then((result) => {
			settled = true;
			return result;
		});

		await Promise.resolve();
		expect(settled).toBe(false);
		expect(deferredSync.resolve).not.toBeNull();
		if (!deferredSync.resolve) {
			throw new Error("Expected the deferred Discord sync resolver.");
		}
		deferredSync.resolve(syncResultRow());

		await expect(signInPromise).resolves.toBe(true);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

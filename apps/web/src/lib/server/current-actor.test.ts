//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/server/current-actor.test.ts                                                        ////
//// Language: TS                                                                                                ////
//// Verifies fresh, fail-closed current actor resolution for server-rendered member and public surfaces.        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { ResolvedAccess } from "@/lib/access/resolve";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getAuthSession: vi.fn(),
	resolveAccessForUser: vi.fn(),
	verifyDiscordRolesIfDue: vi.fn(),
}));

vi.mock("@/lib/access/resolve", () => ({
	resolveAccessForUser: mocks.resolveAccessForUser,
}));

vi.mock("@/lib/auth/auth", () => ({
	getAuthSession: mocks.getAuthSession,
	verifyDiscordRolesIfDue: mocks.verifyDiscordRolesIfDue,
}));

import {
	getCurrentActorDiscordId,
	readAuthUserIdFromSession,
	readDiscordIdFromSession,
} from "@/lib/server/current-actor";

function resolvedAccess(
	overrides: Partial<ResolvedAccess> = {},
): ResolvedAccess {
	return {
		authUserId: "1001",
		discordUserId: "123456789012345678",
		roleIds: [],
		matchedRoles: [],
		rolesLite: [],
		effectiveRank: 1,
		flags: { isAdmin: false, isEditor: false },
		defaults: { publicRank: 0, authRank: 1 },
		isAuthenticated: true,
		isMember: true,
		isRoleRefreshDue: false,
		...overrides,
	};
}

describe("session actor readers", () => {
	it("reads normalized auth and Discord identifiers", () => {
		const session = {
			user: {
				id: " 1001 ",
				discordId: " 123456789012345678 ",
			},
		};

		expect(readAuthUserIdFromSession(session)).toBe("1001");
		expect(readDiscordIdFromSession(session)).toBe("123456789012345678");
	});

	it("rejects missing and malformed session values", () => {
		expect(readAuthUserIdFromSession(null)).toBeNull();
		expect(readDiscordIdFromSession({ user: { discordId: "   " } })).toBeNull();
		expect(readDiscordIdFromSession({ user: "not-an-object" })).toBeNull();
	});
});

describe("getCurrentActorDiscordId", () => {
	beforeEach(() => {
		mocks.getAuthSession.mockReset();
		mocks.resolveAccessForUser.mockReset();
		mocks.verifyDiscordRolesIfDue.mockReset();
	});

	it("returns null when no authenticated Discord identity exists", async () => {
		mocks.getAuthSession.mockResolvedValue(null);

		await expect(getCurrentActorDiscordId()).resolves.toBeNull();
		expect(mocks.resolveAccessForUser).not.toHaveBeenCalled();
	});

	it("returns a fresh authenticated actor without unnecessary Discord verification", async () => {
		mocks.getAuthSession.mockResolvedValue({
			user: { id: "1001", discordId: "123456789012345678" },
		});
		mocks.resolveAccessForUser.mockResolvedValue(resolvedAccess());

		await expect(getCurrentActorDiscordId()).resolves.toBe("123456789012345678");
		expect(mocks.verifyDiscordRolesIfDue).not.toHaveBeenCalled();
	});

	it("refreshes due roles before returning the actor", async () => {
		mocks.getAuthSession.mockResolvedValue({
			user: { id: "1001", discordId: "123456789012345678" },
		});
		mocks.resolveAccessForUser
			.mockResolvedValueOnce(resolvedAccess({ isRoleRefreshDue: true }))
			.mockResolvedValueOnce(resolvedAccess({ isRoleRefreshDue: false }));
		mocks.verifyDiscordRolesIfDue.mockResolvedValue(true);

		await expect(getCurrentActorDiscordId()).resolves.toBe("123456789012345678");
		expect(mocks.verifyDiscordRolesIfDue).toHaveBeenCalledWith({
			authUserId: "1001",
			discordUserId: "123456789012345678",
		});
		expect(mocks.resolveAccessForUser).toHaveBeenCalledTimes(2);
	});

	it("fails closed when a due role refresh cannot be completed", async () => {
		mocks.getAuthSession.mockResolvedValue({
			user: { id: "1001", discordId: "123456789012345678" },
		});
		mocks.resolveAccessForUser.mockResolvedValue(
			resolvedAccess({ isRoleRefreshDue: true }),
		);
		mocks.verifyDiscordRolesIfDue.mockResolvedValue(false);

		await expect(getCurrentActorDiscordId()).resolves.toBeNull();
	});

	it("fails closed when the refreshed access row remains stale", async () => {
		mocks.getAuthSession.mockResolvedValue({
			user: { id: "1001", discordId: "123456789012345678" },
		});
		mocks.resolveAccessForUser.mockResolvedValue(
			resolvedAccess({ isRoleRefreshDue: true }),
		);
		mocks.verifyDiscordRolesIfDue.mockResolvedValue(true);

		await expect(getCurrentActorDiscordId()).resolves.toBeNull();
		expect(mocks.resolveAccessForUser).toHaveBeenCalledTimes(2);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

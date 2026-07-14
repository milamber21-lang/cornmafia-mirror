//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/auth/authz.test.ts                                                                  ////
//// Language: TS                                                                                                ////
//// Verifies that admin and editor authorization refreshes stale Discord roles and fails closed.                ////
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
	requireAdmin,
	requireAdminOrEditor,
	requireEditor,
} from "@/lib/auth/authz";

function access(overrides: Partial<ResolvedAccess> = {}): ResolvedAccess {
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

beforeEach(() => {
	mocks.getAuthSession.mockReset();
	mocks.resolveAccessForUser.mockReset();
	mocks.verifyDiscordRolesIfDue.mockReset();
});

describe("authorization guards", () => {
	it("denies unauthenticated sessions", async () => {
		mocks.getAuthSession.mockResolvedValue(null);

		await expect(requireAdmin()).resolves.toEqual({
			allowed: false,
			reason: "not-authenticated",
		});
	});

	it("fails closed when a due role refresh fails", async () => {
		mocks.getAuthSession.mockResolvedValue({
			user: { id: "1001", discordId: "123456789012345678" },
		});
		mocks.resolveAccessForUser.mockResolvedValue(
			access({ isRoleRefreshDue: true }),
		);
		mocks.verifyDiscordRolesIfDue.mockResolvedValue(false);

		await expect(requireAdmin()).resolves.toEqual({
			allowed: false,
			reason: "role-refresh-failed",
		});
	});

	it("allows an admin only after a successful refresh is reflected in DB access", async () => {
		mocks.getAuthSession.mockResolvedValue({
			user: { id: "1001", discordId: "123456789012345678" },
		});
		mocks.resolveAccessForUser
			.mockResolvedValueOnce(access({ isRoleRefreshDue: true }))
			.mockResolvedValueOnce(
				access({ flags: { isAdmin: true, isEditor: false } }),
			);
		mocks.verifyDiscordRolesIfDue.mockResolvedValue(true);

		await expect(requireAdmin()).resolves.toEqual({ allowed: true });
		expect(mocks.resolveAccessForUser).toHaveBeenCalledTimes(2);
	});

	it("keeps editor-only access separate from admin access", async () => {
		mocks.getAuthSession.mockResolvedValue({
			user: { id: "1001", discordId: "123456789012345678" },
		});
		mocks.resolveAccessForUser.mockResolvedValue(
			access({ flags: { isAdmin: false, isEditor: true } }),
		);

		await expect(requireAdmin()).resolves.toEqual({
			allowed: false,
			reason: "not-admin",
		});
		await expect(requireEditor()).resolves.toEqual({ allowed: true });
		await expect(requireAdminOrEditor()).resolves.toEqual({ allowed: true });
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
